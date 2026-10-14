import { describe, it, expect } from 'vitest';
import { evaluateNewBadges } from './badges';
import type { Habit } from '../models/habit';
import type { Completion } from '../models/completion';

function createMockHabit(id: string, categoryId = 'cat-1'): Habit {
  return {
    id,
    name: `Habit ${id}`,
    description: '',
    icon: '⚡',
    color: '#818cf8',
    categoryId,
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
  };
}

describe('Badges Evaluation Service (SPEC.md §7.3)', () => {
  it('unlocks "comp_1" on first completion', () => {
    const habit = createMockHabit('h1');
    const completions: Completion[] = [
      {
        id: 'c1',
        habitId: 'h1',
        date: '2026-10-14',
        value: 1,
        isRetroactive: false,
        completedAt: new Date(),
      },
    ];

    const badges = evaluateNewBadges({
      habits: [habit],
      completions,
      freezeDays: [],
      moods: [],
      currentLevel: 1,
      challenges: [],
      unlockedBadgeIds: new Set(),
      today: '2026-10-14',
      weekStartsOn: 1,
    });

    expect(badges.some((b) => b.id === 'comp_1')).toBe(true);
  });

  it('unlocks streak badges (3j, 7j)', () => {
    const habit = createMockHabit('h1');
    const completions: Completion[] = ['2026-10-11', '2026-10-12', '2026-10-13'].map(
      (date, idx) => ({
        id: `c-${idx}`,
        habitId: 'h1',
        date,
        value: 1,
        isRetroactive: false,
        completedAt: new Date(),
      })
    );

    const badges = evaluateNewBadges({
      habits: [habit],
      completions,
      freezeDays: [],
      moods: [],
      currentLevel: 1,
      challenges: [],
      unlockedBadgeIds: new Set(['comp_1']),
      today: '2026-10-13',
      weekStartsOn: 1,
    });

    expect(badges.some((b) => b.id === 'streak_3')).toBe(true);
    expect(badges.some((b) => b.id === 'streak_7')).toBe(false);
  });

  it('does not re-unlock already unlocked badges', () => {
    const habit = createMockHabit('h1');
    const completions: Completion[] = [
      {
        id: 'c1',
        habitId: 'h1',
        date: '2026-10-14',
        value: 1,
        isRetroactive: false,
        completedAt: new Date(),
      },
    ];

    const badges = evaluateNewBadges({
      habits: [habit],
      completions,
      freezeDays: [],
      moods: [],
      currentLevel: 1,
      challenges: [],
      unlockedBadgeIds: new Set(['comp_1']), // Already unlocked
      today: '2026-10-14',
      weekStartsOn: 1,
    });

    expect(badges.some((b) => b.id === 'comp_1')).toBe(false);
  });

  it('unlocks diversity badge "active_5" when 5 active habits exist', () => {
    const habits = [
      createMockHabit('h1'),
      createMockHabit('h2'),
      createMockHabit('h3'),
      createMockHabit('h4'),
      createMockHabit('h5'),
    ];

    const badges = evaluateNewBadges({
      habits,
      completions: [],
      freezeDays: [],
      moods: [],
      currentLevel: 1,
      challenges: [],
      unlockedBadgeIds: new Set(),
      today: '2026-10-14',
      weekStartsOn: 1,
    });

    expect(badges.some((b) => b.id === 'active_5')).toBe(true);
  });
});
