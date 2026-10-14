import { describe, it, expect } from 'vitest';
import { calculateXPGain, getCumulativeXPForLevel, getLevelInfo, BASE_XP_MAP } from './xp';

describe('XP Service (SPEC.md §7.1)', () => {
  it('applies base XP according to difficulty', () => {
    expect(BASE_XP_MAP.easy).toBe(10);
    expect(BASE_XP_MAP.medium).toBe(20);
    expect(BASE_XP_MAP.hard).toBe(35);
    expect(calculateXPGain({ difficulty: 'easy', currentStreak: 0 }).baseXP).toBe(10);
    expect(calculateXPGain({ difficulty: 'medium', currentStreak: 0 }).baseXP).toBe(20);
    expect(calculateXPGain({ difficulty: 'hard', currentStreak: 0 }).baseXP).toBe(35);
  });

  it('applies streak multipliers (7j = x1.5, 30j = x2.0, 100j = x3.0)', () => {
    // 0 streak
    expect(calculateXPGain({ difficulty: 'medium', currentStreak: 3 }).totalXP).toBe(20);
    // 7+ streak: 20 * 1.5 = 30
    expect(calculateXPGain({ difficulty: 'medium', currentStreak: 7 }).totalXP).toBe(30);
    expect(calculateXPGain({ difficulty: 'medium', currentStreak: 15 }).totalXP).toBe(30);
    // 30+ streak: 20 * 2.0 = 40
    expect(calculateXPGain({ difficulty: 'medium', currentStreak: 30 }).totalXP).toBe(40);
    // 100+ streak: 20 * 3.0 = 60
    expect(calculateXPGain({ difficulty: 'medium', currentStreak: 100 }).totalXP).toBe(60);
  });

  it('applies early bird multiplier (x1.2 before 09:00)', () => {
    // Medium (20) before 9h: 20 * 1.2 = 24
    expect(
      calculateXPGain({ difficulty: 'medium', currentStreak: 0, completedAtTime: '07:30' }).totalXP
    ).toBe(24);

    // Single digit hour '8:30'
    expect(
      calculateXPGain({ difficulty: 'medium', currentStreak: 0, completedAtTime: '8:30' }).totalXP
    ).toBe(24);

    // Full ISO timestamp before 9h
    expect(
      calculateXPGain({
        difficulty: 'medium',
        currentStreak: 0,
        completedAtTime: '2026-10-14T06:45:00Z',
      }).totalXP
    ).toBe(24);

    // Exact boundary at 08:59 (eligible)
    expect(
      calculateXPGain({ difficulty: 'medium', currentStreak: 0, completedAtTime: '08:59' }).totalXP
    ).toBe(24);

    // Exact boundary at 09:00 (not eligible)
    expect(
      calculateXPGain({ difficulty: 'medium', currentStreak: 0, completedAtTime: '09:00' }).totalXP
    ).toBe(20);

    // Full ISO timestamp after 9h: no multiplier
    expect(
      calculateXPGain({
        difficulty: 'medium',
        currentStreak: 0,
        completedAtTime: '2026-10-14T14:15:00Z',
      }).totalXP
    ).toBe(20);

    // After 9h: no multiplier
    expect(
      calculateXPGain({ difficulty: 'medium', currentStreak: 0, completedAtTime: '10:15' }).totalXP
    ).toBe(20);
  });

  it('combines streak and early bird multipliers multiplicatively', () => {
    // Hard (35) with streak 7+ (x1.5) and before 9h (x1.2) -> 35 * 1.5 * 1.2 = 63
    const res = calculateXPGain({
      difficulty: 'hard',
      currentStreak: 10,
      completedAtTime: '08:00',
    });
    expect(res.totalXP).toBe(63);
  });

  it('adds +50 XP bonus on perfect day', () => {
    const res = calculateXPGain({
      difficulty: 'easy',
      currentStreak: 0,
      isPerfectDay: true,
    });
    // 10 + 50 = 60
    expect(res.totalXP).toBe(60);
  });
});

describe('Levels & Progression (SPEC.md §7.2)', () => {
  it('calculates level bounds from XP', () => {
    expect(getCumulativeXPForLevel(1)).toBe(0);
    expect(getCumulativeXPForLevel(2)).toBe(100);
    expect(getLevelInfo(0).level).toBe(1);
    expect(getLevelInfo(99).level).toBe(1);
    expect(getLevelInfo(100).level).toBe(2);
    expect(getLevelInfo(1500).level).toBeGreaterThanOrEqual(5);
  });

  it('provides percentage progress within level', () => {
    const info = getLevelInfo(50);
    expect(info.level).toBe(1);
    expect(info.progressPercent).toBe(50);
  });
});
