import { describe, it, expect, beforeEach } from 'vitest';
import { db } from '../db';
import { useGamificationStore } from './useGamificationStore';

describe('useGamificationStore - Anti-Exploit / Infinite XP Prevention', () => {
  beforeEach(async () => {
    await db.userProfile.clear();
    await db.xpEvents.clear();
    await db.completions.clear();
    await useGamificationStore.getState().loadGamification();
  });

  it('awards XP on the first completion of a habit', async () => {
    const store = useGamificationStore.getState();
    const initialXP = store.profile?.totalXP ?? 0;

    const res = await store.addXP(20, {
      date: '2026-10-15',
      habitId: 'habit-water',
      habitName: 'Boire 2L d eau',
      reason: 'habit_completion',
    });

    expect(res.alreadyAwarded).toBe(false);
    expect(useGamificationStore.getState().profile?.totalXP).toBe(initialXP + 20);
    expect(useGamificationStore.getState().isHabitAwardedToday('habit-water')).toBe(true);
  });

  it('blocks duplicate XP awards when unticked then reticked on the same day', async () => {
    const store = useGamificationStore.getState();

    // 1st tick: gains 20 XP
    const firstRes = await store.addXP(20, {
      date: '2026-10-15',
      habitId: 'habit-run',
      habitName: 'Courir 5km',
      reason: 'habit_completion',
    });
    expect(firstRes.alreadyAwarded).toBe(false);
    const xpAfterFirstTick = useGamificationStore.getState().profile?.totalXP;

    // 2nd tick (simulating untick then retick): should be BLOCKED
    const secondRes = await store.addXP(20, {
      date: '2026-10-15',
      habitId: 'habit-run',
      habitName: 'Courir 5km',
      reason: 'habit_completion',
    });

    expect(secondRes.alreadyAwarded).toBe(true);
    expect(useGamificationStore.getState().profile?.totalXP).toBe(xpAfterFirstTick);

    // 3rd tick: should also be BLOCKED
    const thirdRes = await store.addXP(20, {
      date: '2026-10-15',
      habitId: 'habit-run',
      habitName: 'Courir 5km',
      reason: 'habit_completion',
    });
    expect(thirdRes.alreadyAwarded).toBe(true);
    expect(useGamificationStore.getState().profile?.totalXP).toBe(xpAfterFirstTick);
  });

  it('allows different habits to earn XP independently', async () => {
    const store = useGamificationStore.getState();
    const initialXP = store.profile?.totalXP ?? 0;

    await store.addXP(15, {
      date: '2026-10-15',
      habitId: 'habit-1',
      habitName: 'Habit 1',
    });

    await store.addXP(25, {
      date: '2026-10-15',
      habitId: 'habit-2',
      habitName: 'Habit 2',
    });

    expect(useGamificationStore.getState().profile?.totalXP).toBe(initialXP + 40);
  });

  it('resets awarded habits on a new day (midnight rollover)', async () => {
    const store = useGamificationStore.getState();

    // Day 1 (2026-10-15): habit-3 gains XP
    const resDay1 = await store.addXP(20, {
      date: '2026-10-15',
      habitId: 'habit-3',
      habitName: 'Habit 3',
    });
    expect(resDay1.alreadyAwarded).toBe(false);
    expect(useGamificationStore.getState().isHabitAwardedToday('habit-3', '2026-10-15')).toBe(true);

    // Day 2 (2026-10-16): habit-3 MUST be eligible to gain XP again on the new day
    expect(useGamificationStore.getState().isHabitAwardedToday('habit-3', '2026-10-16')).toBe(
      false
    );

    const resDay2 = await store.addXP(20, {
      date: '2026-10-16',
      habitId: 'habit-3',
      habitName: 'Habit 3',
    });
    expect(resDay2.alreadyAwarded).toBe(false);
    expect(useGamificationStore.getState().isHabitAwardedToday('habit-3', '2026-10-16')).toBe(true);
  });
});
