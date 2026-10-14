import { create } from 'zustand';
import type { UnlockedBadge, BadgeDefinition } from '../models/badge';
import type { UserProfile } from '../models/user-profile';
import { db } from '../db';
import { badgeRepository } from '../db/repositories/badge.repository';
import { getLevelInfo } from '../services/xp';
import { evaluateNewBadges, type BadgeEvaluationContext } from '../services/badges';
import { triggerLevelUpConfetti } from '../utils/confetti';

export interface GamificationStoreState {
  profile: UserProfile | null;
  unlockedBadges: UnlockedBadge[];
  pendingBadge: BadgeDefinition | null;
  levelUpModal: number | null;
  isLoading: boolean;

  loadGamification: () => Promise<void>;
  addXP: (amount: number) => Promise<{ newLevel: number; leveledUp: boolean }>;
  selectTitle: (title: string) => Promise<void>;
  unlockBadge: (badgeId: string) => Promise<UnlockedBadge | null>;
  isBadgeUnlocked: (badgeId: string) => boolean;
  dismissBadgeUnlock: () => void;
  dismissLevelUp: () => void;
  consumeFreezeDay: () => Promise<boolean>;
  awardFreezeDays: (count: number) => Promise<void>;
  checkBadges: (
    context: Omit<BadgeEvaluationContext, 'currentLevel' | 'unlockedBadgeIds'>
  ) => Promise<BadgeDefinition[]>;
}

export const useGamificationStore = create<GamificationStoreState>((set, get) => ({
  profile: null,
  unlockedBadges: [],
  pendingBadge: null,
  levelUpModal: null,
  isLoading: false,

  loadGamification: async () => {
    set({ isLoading: true });
    let profile = await db.userProfile.get('default');
    if (!profile) {
      profile = {
        id: 'default',
        displayName: 'Aventurier',
        totalXP: 0,
        currentLevel: 1,
        selectedTitle: 'Débutant motivé',
        availableFreezeDays: 3, // Initial freeze quota
        createdAt: new Date(),
      };
      await db.userProfile.put(profile);
    } else if (profile.availableFreezeDays === undefined) {
      profile.availableFreezeDays = 3;
      await db.userProfile.put(profile);
    }

    const unlockedBadges = await badgeRepository.getAll();
    set({ profile, unlockedBadges, isLoading: false });
  },

  addXP: async (amount: number) => {
    const current = get().profile;
    if (!current) return { newLevel: 1, leveledUp: false };

    const newTotalXP = current.totalXP + amount;
    const { level: newLevel } = getLevelInfo(newTotalXP);
    const leveledUp = newLevel > current.currentLevel;

    // Award bonus freeze days on level up
    const bonusFreeze = leveledUp
      ? (current.availableFreezeDays || 0) + 1
      : current.availableFreezeDays || 0;

    const updatedProfile: UserProfile = {
      ...current,
      totalXP: newTotalXP,
      currentLevel: newLevel,
      availableFreezeDays: bonusFreeze,
    };

    await db.userProfile.put(updatedProfile);
    set({ profile: updatedProfile });

    if (leveledUp) {
      triggerLevelUpConfetti();
      set({ levelUpModal: newLevel });
    }

    return { newLevel, leveledUp };
  },

  selectTitle: async (title: string) => {
    const current = get().profile;
    if (!current) return;

    const updatedProfile: UserProfile = { ...current, selectedTitle: title };
    await db.userProfile.put(updatedProfile);
    set({ profile: updatedProfile });
  },

  unlockBadge: async (badgeId: string) => {
    const existing = get().unlockedBadges.find((b) => b.badgeId === badgeId);
    if (existing) return null;

    const badge = await badgeRepository.unlock(badgeId);
    set((state) => ({ unlockedBadges: [...state.unlockedBadges, badge] }));
    return badge;
  },

  isBadgeUnlocked: (badgeId: string) => {
    return get().unlockedBadges.some((b) => b.badgeId === badgeId);
  },

  dismissBadgeUnlock: () => {
    set({ pendingBadge: null });
  },

  dismissLevelUp: () => {
    set({ levelUpModal: null });
  },

  consumeFreezeDay: async () => {
    const current = get().profile;
    if (!current || (current.availableFreezeDays ?? 0) <= 0) {
      return false;
    }
    const updated = {
      ...current,
      availableFreezeDays: (current.availableFreezeDays ?? 0) - 1,
    };
    await db.userProfile.put(updated);
    set({ profile: updated });
    return true;
  },

  awardFreezeDays: async (count: number) => {
    const current = get().profile;
    if (!current) return;
    const updated = {
      ...current,
      availableFreezeDays: (current.availableFreezeDays ?? 0) + count,
    };
    await db.userProfile.put(updated);
    set({ profile: updated });
  },

  checkBadges: async (context) => {
    const state = get();
    if (!state.profile) return [];

    const unlockedSet = new Set(state.unlockedBadges.map((b) => b.badgeId));
    const newBadges = evaluateNewBadges({
      ...context,
      currentLevel: state.profile.currentLevel,
      unlockedBadgeIds: unlockedSet,
    });

    if (newBadges.length > 0) {
      for (const badge of newBadges) {
        await badgeRepository.unlock(badge.id);
      }
      const updatedUnlocked = await badgeRepository.getAll();
      set({
        unlockedBadges: updatedUnlocked,
        pendingBadge: newBadges[0],
      });
      triggerLevelUpConfetti();
    }

    return newBadges;
  },
}));
