import { describe, it, expect } from 'vitest';
import { calculateStreak, calculateCurrentStreak, calculateBestStreak } from './streaks';
import type { Habit } from '../models/habit';
import type { Completion } from '../models/completion';
import type { FreezeDay } from '../models/freeze-day';

// Helper to create a base mock habit
function createMockHabit(overrides: Partial<Habit> = {}): Habit {
  return {
    id: 'habit-1',
    name: 'Habitude Test',
    description: '',
    icon: '⚡',
    color: '#6366f1',
    categoryId: null,
    frequencyType: 'daily',
    frequencyConfig: { type: 'daily' },
    targetType: 'boolean',
    targetValue: null,
    targetUnit: null,
    difficulty: 'medium',
    reminderTime: null,
    restDays: [],
    isArchived: false,
    createdAt: new Date('2026-10-01T00:00:00Z'),
    sortOrder: 0,
    ...overrides,
  };
}

function makeCompletion(date: string, value = 1, habitId = 'habit-1'): Completion {
  return {
    id: `comp-${habitId}-${date}`,
    habitId,
    date,
    value,
    isRetroactive: false,
    completedAt: new Date(`${date}T12:00:00Z`),
  };
}

function makeFreeze(date: string, habitId = 'habit-1'): FreezeDay {
  return {
    id: `freeze-${habitId}-${date}`,
    habitId,
    date,
    createdAt: new Date(`${date}T08:00:00Z`),
  };
}

describe('STREAK_RULES: Daily Habits (§3.1)', () => {
  it('returns current=0 and best=0 when there are no completions', () => {
    const habit = createMockHabit();
    const result = calculateStreak(habit, [], [], { today: '2026-10-14', weekStartsOn: 1 });
    expect(result).toEqual({ current: 0, best: 0 });
  });

  it('counts 1 if completed today', () => {
    const habit = createMockHabit();
    const completions = [makeCompletion('2026-10-14')];
    const result = calculateStreak(habit, completions, [], {
      today: '2026-10-14',
      weekStartsOn: 1,
    });
    expect(result).toEqual({ current: 1, best: 1 });
  });

  it('counts consecutive completed days up to today', () => {
    const habit = createMockHabit();
    const completions = [
      makeCompletion('2026-10-10'),
      makeCompletion('2026-10-11'),
      makeCompletion('2026-10-12'),
      makeCompletion('2026-10-13'),
      makeCompletion('2026-10-14'),
    ];
    const result = calculateStreak(habit, completions, [], {
      today: '2026-10-14',
      weekStartsOn: 1,
    });
    expect(result).toEqual({ current: 5, best: 5 });
  });

  it("applies grace period for today: does not break if today isn't completed yet", () => {
    const habit = createMockHabit();
    // Completed yesterday (10-13) and the day before (10-12), but not today (10-14)
    const completions = [makeCompletion('2026-10-12'), makeCompletion('2026-10-13')];
    const result = calculateStreak(habit, completions, [], {
      today: '2026-10-14',
      weekStartsOn: 1,
    });
    expect(result.current).toBe(2);
    expect(result.best).toBe(2);
  });

  it('breaks the streak if yesterday was missed and today is not completed', () => {
    const habit = createMockHabit();
    // Completed 10-12, missed 10-13, today is 10-14
    const completions = [makeCompletion('2026-10-12')];
    const result = calculateStreak(habit, completions, [], {
      today: '2026-10-14',
      weekStartsOn: 1,
    });
    expect(result.current).toBe(0);
    expect(result.best).toBe(1);
  });

  it('calculates best streak across historic breaks', () => {
    const habit = createMockHabit({ createdAt: new Date('2026-10-01T00:00:00Z') });
    const completions = [
      // 4 days run
      makeCompletion('2026-10-01'),
      makeCompletion('2026-10-02'),
      makeCompletion('2026-10-03'),
      makeCompletion('2026-10-04'),
      // missed 10-05
      // 2 days run
      makeCompletion('2026-10-06'),
      makeCompletion('2026-10-07'),
      // missed 10-08
      // 1 day run (today)
      makeCompletion('2026-10-09'),
    ];
    const result = calculateStreak(habit, completions, [], {
      today: '2026-10-09',
      weekStartsOn: 1,
    });
    expect(result.current).toBe(1);
    expect(result.best).toBe(4);
  });

  it('heals a streak when a retroactive completion is inserted (§6.2)', () => {
    const habit = createMockHabit();
    const withoutRetro = [
      makeCompletion('2026-10-05'),
      makeCompletion('2026-10-06'),
      // 2026-10-07 missing
      makeCompletion('2026-10-08'),
      makeCompletion('2026-10-09'),
    ];
    expect(
      calculateCurrentStreak(habit, withoutRetro, [], { today: '2026-10-09', weekStartsOn: 1 })
    ).toBe(2);

    const withRetro = [...withoutRetro, makeCompletion('2026-10-07')];
    expect(
      calculateCurrentStreak(habit, withRetro, [], { today: '2026-10-09', weekStartsOn: 1 })
    ).toBe(5);
  });
});

describe('STREAK_RULES: Freeze Days (§4)', () => {
  it('preserves the streak without incrementing it (✅ ✅ ❄️ ✅ -> 3)', () => {
    const habit = createMockHabit();
    const completions = [
      makeCompletion('2026-10-05'),
      makeCompletion('2026-10-06'),
      // 10-07 is frozen
      makeCompletion('2026-10-08'),
    ];
    const freezeDays = [makeFreeze('2026-10-07')];
    const result = calculateStreak(habit, completions, freezeDays, {
      today: '2026-10-08',
      weekStartsOn: 1,
    });
    // 3 completions + 1 freeze = 3 streak (preserved, not +1)
    expect(result.current).toBe(3);
    expect(result.best).toBe(3);
  });

  it('handles multiple consecutive freeze days (✅ ✅ ❄️ ❄️ ✅ -> 3)', () => {
    const habit = createMockHabit();
    const completions = [
      makeCompletion('2026-10-01'),
      makeCompletion('2026-10-02'),
      // 10-03, 10-04 frozen
      makeCompletion('2026-10-05'),
    ];
    const freezeDays = [makeFreeze('2026-10-03'), makeFreeze('2026-10-04')];
    const result = calculateStreak(habit, completions, freezeDays, {
      today: '2026-10-05',
      weekStartsOn: 1,
    });
    expect(result.current).toBe(3);
  });

  it('does NOT protect an unfreezed missed day (✅ ❄️ ❌ ✅ -> 1)', () => {
    const habit = createMockHabit();
    const completions = [
      makeCompletion('2026-10-01'),
      // 10-02 frozen
      // 10-03 missed!
      makeCompletion('2026-10-04'),
    ];
    const freezeDays = [makeFreeze('2026-10-02')];
    const result = calculateStreak(habit, completions, freezeDays, {
      today: '2026-10-04',
      weekStartsOn: 1,
    });
    expect(result.current).toBe(1);
    expect(result.best).toBe(1);
  });

  it('preserves the streak if today itself is frozen', () => {
    const habit = createMockHabit();
    const completions = [makeCompletion('2026-10-12'), makeCompletion('2026-10-13')];
    const freezeDays = [makeFreeze('2026-10-14')];
    const result = calculateStreak(habit, completions, freezeDays, {
      today: '2026-10-14',
      weekStartsOn: 1,
    });
    expect(result.current).toBe(2);
  });
});

describe('STREAK_RULES: Rest Days (§5)', () => {
  it('skips rest days entirely without breaking streak (Sunday rest day: Ven ✅, Sam ✅, Dim 😴, Lun ✅ -> 3)', () => {
    // 2026-10-09: Friday (5)
    // 2026-10-10: Saturday (6)
    // 2026-10-11: Sunday (0) -> Rest day
    // 2026-10-12: Monday (1)
    const habit = createMockHabit({ restDays: [0] });
    const completions = [
      makeCompletion('2026-10-09'),
      makeCompletion('2026-10-10'),
      makeCompletion('2026-10-12'),
    ];
    const result = calculateStreak(habit, completions, [], {
      today: '2026-10-12',
      weekStartsOn: 1,
    });
    expect(result.current).toBe(3);
    expect(result.best).toBe(3);
  });

  it('ignores voluntary completion on a rest day for streak calculation (§8.4)', () => {
    const habit = createMockHabit({ restDays: [0] }); // Sunday rest
    const completions = [
      makeCompletion('2026-10-09'),
      makeCompletion('2026-10-10'),
      makeCompletion('2026-10-11'), // Sunday voluntarily completed
      makeCompletion('2026-10-12'),
    ];
    const result = calculateStreak(habit, completions, [], {
      today: '2026-10-12',
      weekStartsOn: 1,
    });
    // Still 3 because Sunday is a rest day (ignored in streak count)
    expect(result.current).toBe(3);
  });
});

describe('STREAK_RULES: Weekly Fixed Habits (§3.2)', () => {
  // Monday(1), Wednesday(3), Friday(5)
  const fixedHabit = createMockHabit({
    frequencyType: 'weekly_fixed',
    frequencyConfig: { type: 'weekly_fixed', days: [1, 3, 5] },
  });

  it('counts streak only on scheduled days and skips non-scheduled days', () => {
    // 2026-10-02: Friday (5)
    // 2026-10-05: Monday (1)
    // 2026-10-07: Wednesday (3)
    const completions = [
      makeCompletion('2026-10-02'),
      makeCompletion('2026-10-05'),
      makeCompletion('2026-10-07'),
    ];
    const result = calculateStreak(fixedHabit, completions, [], {
      today: '2026-10-07',
      weekStartsOn: 1,
    });
    expect(result.current).toBe(3);
  });

  it('preserves streak when a scheduled day is frozen', () => {
    // Ven 2 ✅, Lun 5 ✅, Mer 7 ❄️, Ven 9 ✅
    const completions = [
      makeCompletion('2026-10-02'),
      makeCompletion('2026-10-05'),
      makeCompletion('2026-10-09'),
    ];
    const freezeDays = [makeFreeze('2026-10-07')];
    const result = calculateStreak(fixedHabit, completions, freezeDays, {
      today: '2026-10-09',
      weekStartsOn: 1,
    });
    expect(result.current).toBe(3);
  });

  it('breaks streak when a scheduled day is missed (STREAK_RULES spec example)', () => {
    // Ven 2: ✅, Lun 5: ✅, Mer 7: ❄️, Ven 9: ✅, Lun 12: ❌ manqué, Mer 14: ✅ (aujourd'hui)
    const completions = [
      makeCompletion('2026-10-02'),
      makeCompletion('2026-10-05'),
      makeCompletion('2026-10-09'),
      makeCompletion('2026-10-14'),
    ];
    const freezeDays = [makeFreeze('2026-10-07')];
    const result = calculateStreak(fixedHabit, completions, freezeDays, {
      today: '2026-10-14',
      weekStartsOn: 1,
    });
    expect(result.current).toBe(1);
    expect(result.best).toBe(3);
  });

  it("does not break if today is a scheduled day and not completed yet (today's grace)", () => {
    // 2026-10-05: Mon ✅, 2026-10-07: Wed ✅, today is 2026-10-09 (Fri) not completed
    const completions = [makeCompletion('2026-10-05'), makeCompletion('2026-10-07')];
    const result = calculateStreak(fixedHabit, completions, [], {
      today: '2026-10-09',
      weekStartsOn: 1,
    });
    expect(result.current).toBe(2);
  });
});

describe('STREAK_RULES: Weekly Flex Habits (§3.3)', () => {
  // 3 times per week, counted in weeks
  const flexHabit = createMockHabit({
    frequencyType: 'weekly_flex',
    frequencyConfig: { type: 'weekly_flex', timesPerWeek: 3 },
    createdAt: new Date('2026-10-01T00:00:00Z'),
  });

  it('calculates streak in weeks and handles spec example (§3.3)', () => {
    // Sem 1 (5-11 oct) : 3 complétions -> streak = 1
    // Sem 2 (12-18 oct) : 2 complétions + 1 gel -> streak préservé (= 1)
    // Sem 3 (19-25 oct) : 4 complétions -> streak = 2
    // Sem 4 (26 oct-1 nov) : 1 complétion (en cours, today=28 oct) -> ne pas casser
    // Résultat attendu : streak courant = 2 semaines
    const completions = [
      // Sem 1
      makeCompletion('2026-10-05'),
      makeCompletion('2026-10-06'),
      makeCompletion('2026-10-07'),
      // Sem 2
      makeCompletion('2026-10-12'),
      makeCompletion('2026-10-14'),
      // Sem 3
      makeCompletion('2026-10-19'),
      makeCompletion('2026-10-20'),
      makeCompletion('2026-10-21'),
      makeCompletion('2026-10-22'),
      // Sem 4 (en cours)
      makeCompletion('2026-10-26'),
    ];
    const freezeDays = [makeFreeze('2026-10-16')];

    const result = calculateStreak(flexHabit, completions, freezeDays, {
      today: '2026-10-28',
      weekStartsOn: 1,
    });
    expect(result.current).toBe(2);
    expect(result.best).toBe(2);
  });

  it('increments streak immediately when current week achieves the goal', () => {
    const completions = [
      // Sem 1 (5-11 oct)
      makeCompletion('2026-10-05'),
      makeCompletion('2026-10-06'),
      makeCompletion('2026-10-07'),
      // Sem 2 (12-18 oct) - completed 3 times by Wednesday 14th
      makeCompletion('2026-10-12'),
      makeCompletion('2026-10-13'),
      makeCompletion('2026-10-14'),
    ];
    const result = calculateStreak(flexHabit, completions, [], {
      today: '2026-10-14',
      weekStartsOn: 1,
    });
    expect(result.current).toBe(2);
  });

  it('breaks streak when a past week missed the target', () => {
    const completions = [
      // Sem 1 (5-11 oct): 3 complétions
      makeCompletion('2026-10-05'),
      makeCompletion('2026-10-06'),
      makeCompletion('2026-10-07'),
      // Sem 2 (12-18 oct): only 1 completion, no freeze -> broken!
      makeCompletion('2026-10-12'),
      // Sem 3 (19-25 oct): 3 completions
      makeCompletion('2026-10-19'),
      makeCompletion('2026-10-20'),
      makeCompletion('2026-10-21'),
    ];
    const result = calculateStreak(flexHabit, completions, [], {
      today: '2026-10-25',
      weekStartsOn: 1,
    });
    expect(result.current).toBe(1);
    expect(result.best).toBe(1);
  });
});

describe('STREAK_RULES: Interval Habits (§3.4)', () => {
  // Every 3 days
  const intervalHabit = createMockHabit({
    frequencyType: 'interval',
    frequencyConfig: { type: 'interval', everyNDays: 3 },
  });

  it('calculates interval streak when gaps <= everyNDays', () => {
    // Oct 2, Oct 5 (gap 3), Oct 7 (gap 2), today is Oct 7
    const completions = [
      makeCompletion('2026-10-02'),
      makeCompletion('2026-10-05'),
      makeCompletion('2026-10-07'),
    ];
    const result = calculateStreak(intervalHabit, completions, [], {
      today: '2026-10-07',
      weekStartsOn: 1,
    });
    expect(result.current).toBe(3);
    expect(result.best).toBe(3);
  });

  it('breaks when gap exceeds everyNDays (spec example §3.4)', () => {
    // Oct 2, Oct 5, Oct 7, Oct 11 (gap 7 to 11 is 4 > 3)
    const completions = [
      makeCompletion('2026-10-02'),
      makeCompletion('2026-10-05'),
      makeCompletion('2026-10-07'),
      makeCompletion('2026-10-11'),
    ];
    const result = calculateStreak(intervalHabit, completions, [], {
      today: '2026-10-11',
      weekStartsOn: 1,
    });
    expect(result.current).toBe(1);
    expect(result.best).toBe(3);
  });

  it('subtracts freeze days from interval gap', () => {
    // Oct 7 to Oct 11 is gap 4, but Oct 9 is frozen -> effective gap 3 <= 3
    const completions = [
      makeCompletion('2026-10-05'),
      makeCompletion('2026-10-07'),
      makeCompletion('2026-10-11'),
    ];
    const freezeDays = [makeFreeze('2026-10-09')];
    const result = calculateStreak(intervalHabit, completions, freezeDays, {
      today: '2026-10-11',
      weekStartsOn: 1,
    });
    expect(result.current).toBe(3);
  });

  it('returns 0 if the most recent completion is beyond everyNDays ago', () => {
    // Last completion was 2026-10-01, today is 2026-10-06 (gap 5 > 3)
    const completions = [makeCompletion('2026-10-01')];
    const result = calculateStreak(intervalHabit, completions, [], {
      today: '2026-10-06',
      weekStartsOn: 1,
    });
    expect(result.current).toBe(0);
    expect(result.best).toBe(1);
  });

  it('does NOT count multiple completions on the same day twice for interval habits (§8.6)', () => {
    // Two completions on Oct 05, one on Oct 07
    const completions = [
      makeCompletion('2026-10-05'),
      makeCompletion('2026-10-05'), // duplicate on same day
      makeCompletion('2026-10-07'),
    ];
    const result = calculateStreak(intervalHabit, completions, [], {
      today: '2026-10-07',
      weekStartsOn: 1,
    });
    // Should be 2 (Oct 5, Oct 7), not 3!
    expect(result.current).toBe(2);
    expect(result.best).toBe(2);
  });

  it('isolates freeze days by habitId (does not leak freeze tokens across habits)', () => {
    const habitA = createMockHabit({ id: 'habit-A' });
    const completions = [
      makeCompletion('2026-10-10', 1, 'habit-A'),
      // missed 2026-10-11
      makeCompletion('2026-10-12', 1, 'habit-A'),
    ];
    // Freeze day belongs to habit-B, not habit-A
    const foreignFreeze = [
      { id: 'f-1', habitId: 'habit-B', date: '2026-10-11', createdAt: new Date() },
    ];
    const result = calculateStreak(habitA, completions, foreignFreeze, {
      today: '2026-10-12',
      weekStartsOn: 1,
    });
    // Since 2026-10-11 freeze belonged to habit-B, habit-A's streak was broken!
    expect(result.current).toBe(1);
  });
});

describe('STREAK_RULES: Numeric Habits (§8.6)', () => {
  const numericHabit = createMockHabit({
    targetType: 'numeric',
    targetValue: 2000,
    targetUnit: 'ml',
  });

  it('requires value >= targetValue to count towards streak', () => {
    const completions = [
      makeCompletion('2026-10-12', 2000), // met
      makeCompletion('2026-10-13', 1500), // not met (< 2000)
      makeCompletion('2026-10-14', 2500), // met
    ];
    const result = calculateStreak(numericHabit, completions, [], {
      today: '2026-10-14',
      weekStartsOn: 1,
    });
    // 10-13 was not met, so streak broke!
    expect(result.current).toBe(1);
    expect(result.best).toBe(1);
  });

  it('counts streak when all numeric targets are met', () => {
    const completions = [
      makeCompletion('2026-10-12', 2000),
      makeCompletion('2026-10-13', 2100),
      makeCompletion('2026-10-14', 2000),
    ];
    const result = calculateStreak(numericHabit, completions, [], {
      today: '2026-10-14',
      weekStartsOn: 1,
    });
    expect(result.current).toBe(3);
    expect(result.best).toBe(3);
  });
});

describe('STREAK_RULES: Convenience functions', () => {
  it('calculateCurrentStreak and calculateBestStreak match calculateStreak result', () => {
    const habit = createMockHabit();
    const completions = [makeCompletion('2026-10-14')];
    const opts = { today: '2026-10-14', weekStartsOn: 1 as const };

    expect(calculateCurrentStreak(habit, completions, [], opts)).toBe(1);
    expect(calculateBestStreak(habit, completions, [], opts)).toBe(1);
  });
});
