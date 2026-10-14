/**
 * streaks.ts — Pure streak calculation engine for Habix.
 *
 * Implements ALL rules from STREAK_RULES.md:
 *   - §3.1 Daily habits
 *   - §3.2 Weekly fixed habits
 *   - §3.3 Weekly flex habits (counted in weeks)
 *   - §3.4 Interval habits
 *   - §4  Freeze days (preserve streak, no increment)
 *   - §5  Rest days (ignored entirely)
 *   - §7  Best streak (full historical scan)
 *   - §8  Edge cases
 *
 * Design constraints:
 *   - Pure functions only — no side effects, no I/O
 *   - No React, no Dexie, no stores
 *   - All dates are "YYYY-MM-DD" strings in local time
 *   - Fully unit-testable with injected test data
 */

import type {
  Habit,
  FrequencyConfigWeeklyFixed,
  FrequencyConfigWeeklyFlex,
  FrequencyConfigInterval,
} from '../models/habit';
import type { Completion } from '../models/completion';
import type { FreezeDay } from '../models/freeze-day';
import {
  getDayOfWeek,
  subtractDays,
  addDays,
  daysBetween,
  getWeekStart,
  getPreviousWeekStart,
  getWeekEnd,
  isInRange,
  type WeekStartsOn,
} from './date-utils';

// ---------------------------------------------------------------------------
// Public API types
// ---------------------------------------------------------------------------

export interface StreakResult {
  current: number;
  best: number;
}

/** Options shared across all streak functions */
export interface StreakOptions {
  /** "YYYY-MM-DD" — the current date (injected for testability) */
  today: string;
  /** 0=Sunday, 1=Monday — first day of the week */
  weekStartsOn: WeekStartsOn;
}

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

function formatCreatedAt(createdAt: Date | string): string {
  if (createdAt instanceof Date) {
    const y = createdAt.getFullYear();
    const m = String(createdAt.getMonth() + 1).padStart(2, '0');
    const d = String(createdAt.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }
  return String(createdAt).substring(0, 10);
}

/**
 * Build a Set<string> of completion dates for a given habit.
 * For numeric habits, only includes dates where value >= targetValue.
 */
function buildCompletionSet(habit: Habit, completions: Completion[]): Set<string> {
  return new Set(
    completions
      .filter((c) => {
        if (habit.targetType === 'numeric' && habit.targetValue !== null) {
          return c.value >= habit.targetValue;
        }
        return c.value >= 1;
      })
      .map((c) => c.date)
  );
}

function buildFreezeSet(habit: Habit, freezeDays: FreezeDay[]): Set<string> {
  return new Set(freezeDays.filter((f) => !f.habitId || f.habitId === habit.id).map((f) => f.date));
}

function buildRestDaySet(habit: Habit): Set<number> {
  return new Set(habit.restDays ?? []);
}

function getUniqueValidCompletionDates(habit: Habit, completions: Completion[]): string[] {
  const dateSet = new Set<string>();
  completions.forEach((c) => {
    if (habit.targetType === 'numeric' && habit.targetValue !== null) {
      if (c.value >= habit.targetValue) dateSet.add(c.date);
    } else if (c.value >= 1) {
      dateSet.add(c.date);
    }
  });
  return Array.from(dateSet).sort();
}

// ---------------------------------------------------------------------------
// §3.1 + §3.2 — Daily and Weekly-Fixed streak
// ---------------------------------------------------------------------------

/**
 * Calculate current streak for `daily` and `weekly_fixed` habits.
 *
 * Rules (from STREAK_RULES.md §3.1 & §3.2):
 * - Rest days → skip (ignored, don't break streak)
 * - Non-scheduled days (weekly_fixed only) → skip
 * - Completed days → +1
 * - Frozen days → +0 (preserved, not incremented)
 * - Today with no completion → grace (don't break)
 * - Any other day with no completion → break
 */
function calculateDailyOrFixedCurrentStreak(
  habit: Habit,
  completionSet: Set<string>,
  freezeSet: Set<string>,
  restDaySet: Set<number>,
  today: string
): number {
  const expectedDays =
    habit.frequencyType === 'weekly_fixed'
      ? (habit.frequencyConfig as FrequencyConfigWeeklyFixed).days
      : null;

  let streak = 0;
  let date = today;

  // Safety: max lookback = 5 years (1825 days) to prevent infinite loops
  const maxIterations = 1825;
  let iterations = 0;

  while (iterations < maxIterations) {
    iterations++;
    const dow = getDayOfWeek(date);

    // Rest day → skip entirely (transparent)
    if (restDaySet.has(dow)) {
      date = subtractDays(date, 1);
      continue;
    }

    // Weekly fixed: non-scheduled day → skip (transparent)
    if (expectedDays !== null && !expectedDays.includes(dow)) {
      date = subtractDays(date, 1);
      continue;
    }

    // Scheduled day — check state
    if (completionSet.has(date)) {
      streak += 1;
    } else if (freezeSet.has(date)) {
      // Frozen: streak preserved, not incremented
    } else {
      // No completion, not frozen
      if (date === today) {
        // Today's grace: the day isn't over yet, don't break
      } else {
        break; // Streak broken
      }
    }

    date = subtractDays(date, 1);
  }

  return streak;
}

/**
 * Calculate best streak for `daily` and `weekly_fixed` habits.
 *
 * Algorithm from STREAK_RULES.md §7:
 * Scan from createdAt (or earliest completion) to today, track running count, record max.
 */
function calculateDailyOrFixedBestStreak(
  habit: Habit,
  completionSet: Set<string>,
  freezeSet: Set<string>,
  restDaySet: Set<number>,
  today: string
): number {
  const expectedDays =
    habit.frequencyType === 'weekly_fixed'
      ? (habit.frequencyConfig as FrequencyConfigWeeklyFixed).days
      : null;

  let startDate = formatCreatedAt(habit.createdAt);
  for (const d of completionSet) {
    if (d < startDate) startDate = d;
  }
  for (const d of freezeSet) {
    if (d < startDate) startDate = d;
  }

  let best = 0;
  let current = 0;
  let date = startDate;

  const maxIterations = 1825;
  let iterations = 0;

  while (date <= today && iterations < maxIterations) {
    iterations++;
    const dow = getDayOfWeek(date);

    // Rest day → skip
    if (restDaySet.has(dow)) {
      date = addDays(date, 1);
      continue;
    }

    // Weekly fixed: non-scheduled day → skip
    if (expectedDays !== null && !expectedDays.includes(dow)) {
      date = addDays(date, 1);
      continue;
    }

    if (completionSet.has(date)) {
      current += 1;
    } else if (freezeSet.has(date)) {
      // Frozen: preserved, not incremented
    } else if (date < today) {
      // Missed day in the past: reset run
      if (current > best) best = current;
      current = 0;
    }
    // If date === today and no completion: don't reset (grace)

    date = addDays(date, 1);
  }

  if (current > best) best = current;
  return best;
}

// ---------------------------------------------------------------------------
// §3.3 — Weekly Flex streak (counted in weeks)
// ---------------------------------------------------------------------------

/**
 * Calculate current streak (in weeks) for `weekly_flex` habits.
 *
 * A week is "completed" if completions >= timesPerWeek.
 * A week is "preserved" if completions + freezes >= timesPerWeek.
 * Current week: don't break (still in progress).
 */
function calculateWeeklyFlexCurrentStreak(
  habit: Habit,
  completionSet: Set<string>,
  freezeSet: Set<string>,
  today: string,
  weekStartsOn: WeekStartsOn
): number {
  const { timesPerWeek } = habit.frequencyConfig as FrequencyConfigWeeklyFlex;

  let streak = 0;
  let weekStart = getWeekStart(today, weekStartsOn);

  const maxWeeks = 260; // ~5 years
  let iterations = 0;

  while (iterations < maxWeeks) {
    iterations++;
    const weekEnd = getWeekEnd(weekStart, weekStartsOn);

    // Count completions and freezes in this week
    let completions = 0;
    let freezes = 0;
    let d = weekStart;
    while (d <= weekEnd) {
      if (completionSet.has(d)) completions++;
      else if (freezeSet.has(d)) freezes++;
      d = addDays(d, 1);
    }

    const isCurrentWeek = isInRange(today, weekStart, weekEnd);

    if (completions >= timesPerWeek) {
      streak += 1;
    } else if (completions + freezes >= timesPerWeek) {
      // Preserved (frozen week)
    } else {
      if (isCurrentWeek) {
        // In progress — don't break
      } else {
        break; // Streak broken
      }
    }

    weekStart = getPreviousWeekStart(weekStart, weekStartsOn);
  }

  return streak;
}

/**
 * Calculate best streak (in weeks) for `weekly_flex` habits.
 */
function calculateWeeklyFlexBestStreak(
  habit: Habit,
  completionSet: Set<string>,
  freezeSet: Set<string>,
  today: string,
  weekStartsOn: WeekStartsOn
): number {
  const { timesPerWeek } = habit.frequencyConfig as FrequencyConfigWeeklyFlex;

  let startDate = formatCreatedAt(habit.createdAt);
  for (const d of completionSet) {
    if (d < startDate) startDate = d;
  }
  for (const d of freezeSet) {
    if (d < startDate) startDate = d;
  }

  let best = 0;
  let current = 0;
  let weekStart = getWeekStart(startDate, weekStartsOn);

  const maxWeeks = 260;
  let iterations = 0;

  while (weekStart <= today && iterations < maxWeeks) {
    iterations++;
    const weekEnd = getWeekEnd(weekStart, weekStartsOn);

    let completions = 0;
    let freezes = 0;
    let d = weekStart;
    while (d <= weekEnd) {
      if (completionSet.has(d)) completions++;
      else if (freezeSet.has(d)) freezes++;
      d = addDays(d, 1);
    }

    const isCurrentWeek = isInRange(today, weekStart, weekEnd);

    if (completions >= timesPerWeek) {
      current += 1;
    } else if (completions + freezes >= timesPerWeek) {
      // Preserved
    } else if (!isCurrentWeek) {
      if (current > best) best = current;
      current = 0;
    }

    weekStart = addDays(weekEnd, 1);
  }

  if (current > best) best = current;
  return best;
}

// ---------------------------------------------------------------------------
// §3.4 — Interval streak
// ---------------------------------------------------------------------------

/**
 * Calculate current streak for `interval` habits.
 *
 * Algorithm from STREAK_RULES.md §3.4:
 * - Sort completions DESC.
 * - If most recent completion is > everyNDays ago (accounting for freeze days) → streak = 0.
 * - Walk pairs: if gap (minus freeze days between pair) <= everyNDays → continue.
 * - Each valid pair adds 1; plus 1 for the last (oldest) completion.
 */
function calculateIntervalCurrentStreak(
  habit: Habit,
  completions: Completion[],
  freezeSet: Set<string>,
  today: string
): number {
  const { everyNDays } = habit.frequencyConfig as FrequencyConfigInterval;

  // Deduplicate by date and sort ascending (oldest first)
  const sortedDates = getUniqueValidCompletionDates(habit, completions);
  if (sortedDates.length === 0) return 0;

  // Check if the most recent completion is still within the window
  const lastDate = sortedDates[sortedDates.length - 1];
  const gapFromLast = daysBetween(lastDate, today);

  // Freeze days between last completion and today
  let freezeCountSinceLast = 0;
  let fd = addDays(lastDate, 1);
  while (fd <= today) {
    if (freezeSet.has(fd)) freezeCountSinceLast++;
    fd = addDays(fd, 1);
  }

  if (gapFromLast - freezeCountSinceLast > everyNDays) return 0;

  // Walk pairs from newest to oldest
  let streak = 1;

  for (let i = sortedDates.length - 1; i > 0; i--) {
    const newer = sortedDates[i];
    const older = sortedDates[i - 1];
    const gap = daysBetween(older, newer);

    // Count freeze days between the two completions (exclusive bounds)
    let freezeCount = 0;
    let d = addDays(older, 1);
    while (d < newer) {
      if (freezeSet.has(d)) freezeCount++;
      d = addDays(d, 1);
    }

    const effectiveGap = gap - freezeCount;
    if (effectiveGap <= everyNDays) {
      streak += 1;
    } else {
      break;
    }
  }

  return streak;
}

/**
 * Calculate best streak for `interval` habits.
 */
function calculateIntervalBestStreak(
  habit: Habit,
  completions: Completion[],
  freezeSet: Set<string>
): number {
  const { everyNDays } = habit.frequencyConfig as FrequencyConfigInterval;

  const sortedDates = getUniqueValidCompletionDates(habit, completions);
  if (sortedDates.length === 0) return 0;

  let best = 1;
  let current = 1;

  for (let i = 1; i < sortedDates.length; i++) {
    const older = sortedDates[i - 1];
    const newer = sortedDates[i];
    const gap = daysBetween(older, newer);

    let freezeCount = 0;
    let d = addDays(older, 1);
    while (d < newer) {
      if (freezeSet.has(d)) freezeCount++;
      d = addDays(d, 1);
    }

    const effectiveGap = gap - freezeCount;
    if (effectiveGap <= everyNDays) {
      current += 1;
    } else {
      if (current > best) best = current;
      current = 1;
    }
  }

  if (current > best) best = current;
  return best;
}

// ---------------------------------------------------------------------------
// Public entry points
// ---------------------------------------------------------------------------

/**
 * Calculate both current and best streak for any habit type.
 *
 * @param habit       The habit definition (frequencyType, config, restDays, etc.)
 * @param completions All completions for this habit (any order)
 * @param freezeDays  All freeze days for this habit
 * @param options     { today: "YYYY-MM-DD", weekStartsOn: 0|1 }
 */
export function calculateStreak(
  habit: Habit,
  completions: Completion[],
  freezeDays: FreezeDay[],
  options: StreakOptions
): StreakResult {
  const { today, weekStartsOn } = options;

  const completionSet = buildCompletionSet(habit, completions);
  const freezeSet = buildFreezeSet(habit, freezeDays);
  const restDaySet = buildRestDaySet(habit);

  switch (habit.frequencyType) {
    case 'weekly_flex': {
      const current = calculateWeeklyFlexCurrentStreak(
        habit,
        completionSet,
        freezeSet,
        today,
        weekStartsOn
      );
      const best = calculateWeeklyFlexBestStreak(
        habit,
        completionSet,
        freezeSet,
        today,
        weekStartsOn
      );
      return { current, best };
    }

    case 'interval': {
      const current = calculateIntervalCurrentStreak(habit, completions, freezeSet, today);
      const best = calculateIntervalBestStreak(habit, completions, freezeSet);
      return { current, best };
    }

    case 'daily':
    case 'weekly_fixed':
    default: {
      const current = calculateDailyOrFixedCurrentStreak(
        habit,
        completionSet,
        freezeSet,
        restDaySet,
        today
      );
      const best = calculateDailyOrFixedBestStreak(
        habit,
        completionSet,
        freezeSet,
        restDaySet,
        today
      );
      return { current, best };
    }
  }
}

/**
 * Convenience: calculate only the current streak.
 */
export function calculateCurrentStreak(
  habit: Habit,
  completions: Completion[],
  freezeDays: FreezeDay[],
  options: StreakOptions
): number {
  return calculateStreak(habit, completions, freezeDays, options).current;
}

/**
 * Convenience: calculate only the best streak.
 */
export function calculateBestStreak(
  habit: Habit,
  completions: Completion[],
  freezeDays: FreezeDay[],
  options: StreakOptions
): number {
  return calculateStreak(habit, completions, freezeDays, options).best;
}
