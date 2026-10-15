import { create } from 'zustand';
import type { Challenge } from '../models/challenge';
import { db } from '../db';
import { useGamificationStore } from './useGamificationStore';

export interface ChallengeStoreState {
  challenges: Challenge[];
  isLoading: boolean;

  loadChallenges: () => Promise<void>;
  startChallenge: (habitId: string, duration: 21 | 30, startDate: string) => Promise<string>;
  abandonChallenge: (id: string) => Promise<void>;
  updateChallengeProgress: (
    habitId: string,
    today: string,
    isCompleted: boolean,
    isFrozen: boolean
  ) => Promise<void>;
}

export const useChallengeStore = create<ChallengeStoreState>((set, get) => ({
  challenges: [],
  isLoading: false,

  loadChallenges: async () => {
    set({ isLoading: true });
    const challenges = await db.challenges.toArray();
    set({ challenges, isLoading: false });
  },

  startChallenge: async (habitId, duration, startDate) => {
    // Check if an active challenge already exists for this habit
    const active = get().challenges.find((c) => c.habitId === habitId && c.status === 'active');
    if (active) throw new Error('Un défi est déjà en cours pour cette habitude.');

    const newChallenge: Challenge = {
      id: `challenge-${Date.now()}`,
      habitId,
      duration,
      startDate,
      currentDay: 1,
      status: 'active',
      completedAt: null,
    };

    await db.challenges.add(newChallenge);
    set((state) => ({ challenges: [...state.challenges, newChallenge] }));
    return newChallenge.id;
  },

  abandonChallenge: async (id) => {
    const target = get().challenges.find((c) => c.id === id);
    if (!target) return;

    const updated: Challenge = { ...target, status: 'abandoned' };
    await db.challenges.put(updated);
    set((state) => ({
      challenges: state.challenges.map((c) => (c.id === id ? updated : c)),
    }));
  },

  updateChallengeProgress: async (habitId, today, isCompleted, isFrozen) => {
    const active = get().challenges.find((c) => c.habitId === habitId && c.status === 'active');
    if (!active) return;

    // If day is frozen: challenge suspended (no progress, no failure)
    if (isFrozen) return;

    if (isCompleted) {
      if (active.lastProgressDate === today) {
        return;
      }

      const nextDay = active.currentDay + 1;
      const isFinished = nextDay > active.duration;

      const updated: Challenge = {
        ...active,
        currentDay: Math.min(active.duration, nextDay),
        lastProgressDate: today,
        status: isFinished ? 'completed' : 'active',
        completedAt: isFinished ? new Date() : null,
      };

      await db.challenges.put(updated);
      set((state) => ({
        challenges: state.challenges.map((c) => (c.id === active.id ? updated : c)),
      }));

      if (isFinished) {
        // Bonus XP
        const xpBonus = active.duration === 21 ? 100 : 200;
        await useGamificationStore.getState().addXP(xpBonus);
      }
    }
  },
}));
