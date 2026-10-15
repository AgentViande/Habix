import { create } from 'zustand';
import type { UnlockedBadge, BadgeDefinition } from '../models/badge';
import type { UserProfile } from '../models/user-profile';
import { db } from '../db';
import { badgeRepository } from '../db/repositories/badge.repository';
import { getLevelInfo } from '../services/xp';
import { evaluateNewBadges, type BadgeEvaluationContext } from '../services/badges';
import { triggerLevelUpConfetti } from '../utils/confetti';
import { sounds } from '../lib/sounds';
import type { XPReason } from '../models/xp-event';

export interface GamificationStoreState {
  profile: UserProfile | null;
  unlockedBadges: UnlockedBadge[];
  pendingBadge: BadgeDefinition | null;
  pendingBadges: BadgeDefinition[];
  levelUpModal: number | null;
  isLoading: boolean;

  loadGamification: () => Promise<void>;
  addXP: (
    amount: number,
    metadata?: { date?: string; habitId?: string; habitName?: string; reason?: XPReason }
  ) => Promise<{ newLevel: number; leveledUp: boolean }>;
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
  pendingBadges: [],
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

    let unlockedBadges = await badgeRepository.getAll();

    // Migrate legacy first_step to comp_1 if present
    const hasFirstStep = unlockedBadges.some((b) => b.badgeId === 'first_step');
    const hasComp1 = unlockedBadges.some((b) => b.badgeId === 'comp_1');
    if (hasFirstStep && !hasComp1) {
      await badgeRepository.unlock('comp_1');
      unlockedBadges = await badgeRepository.getAll();
    }

    set({ profile, unlockedBadges, isLoading: false });
  },

  addXP: async (
    amount: number,
    metadata?: { date?: string; habitId?: string; habitName?: string; reason?: XPReason }
  ) => {
    const current = get().profile;
    if (!current) return { newLevel: 1, leveledUp: false };

    if (amount > 0) {
      try {
        const todayStr = metadata?.date || new Intl.DateTimeFormat('fr-CA').format(new Date());
        await db.xpEvents.add({
          id: `xpe-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
          date: todayStr,
          amount,
          reason: metadata?.reason || 'habit_completion',
          habitId: metadata?.habitId,
          habitName: metadata?.habitName,
          createdAt: new Date(),
        });
      } catch (e) {
        console.warn('Could not record XP event:', e);
      }
    }

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
      sounds.playLevelUp();
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
    return get().unlockedBadges.some(
      (b) => b.badgeId === badgeId || (badgeId === 'comp_1' && b.badgeId === 'first_step')
    );
  },

  dismissBadgeUnlock: () => {
    const queue = get().pendingBadges;
    if (queue.length > 1) {
      const nextQueue = queue.slice(1);
      set({
        pendingBadges: nextQueue,
        pendingBadge: nextQueue[0],
      });
    } else {
      set({ pendingBadges: [], pendingBadge: null });
    }
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
    let state = get();
    if (!state.profile) {
      await get().loadGamification();
      state = get();
    }

    const currentLevel = state.profile?.currentLevel ?? 1;
    const unlockedSet = new Set(state.unlockedBadges.map((b) => b.badgeId));
    if (unlockedSet.has('first_step')) {
      unlockedSet.add('comp_1');
    }

    const newBadges = evaluateNewBadges({
      ...context,
      currentLevel,
      unlockedBadgeIds: unlockedSet,
    });

    if (newBadges.length > 0) {
      for (const badge of newBadges) {
        await badgeRepository.unlock(badge.id);
      }
      const updatedUnlocked = await badgeRepository.getAll();
      set((prev) => {
        const queue = [...prev.pendingBadges, ...newBadges];
        return {
          unlockedBadges: updatedUnlocked,
          pendingBadges: queue,
          pendingBadge: prev.pendingBadge || queue[0],
        };
      });
      sounds.playMilestone();
      triggerLevelUpConfetti();
    }

    return newBadges;
  },
}));
