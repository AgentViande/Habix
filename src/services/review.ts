import type { Habit } from '../models/habit';
import type { Completion } from '../models/completion';
import type { FreezeDay } from '../models/freeze-day';
import type { MoodEntry } from '../models/mood';
import { getWeekStart, getWeekEnd, subtractDays, isInRange, getDayOfWeek } from '../lib/date-utils';
import { calculateStreak } from '../lib/streaks';

export interface WeeklyReviewData {
  weekStart: string;
  weekEnd: string;
  completionRate: number; // 0 - 100
  previousWeekRate: number; // 0 - 100
  rateDelta: number; // positive or negative
  totalCompletionsThisWeek: number;
  topHabits: Array<{ habit: Habit; completionCount: number; rate: number }>;
  strugglingHabits: Array<{ habit: Habit; completionCount: number; rate: number }>;
  averageMood: number | null; // 1-5
  moodCount: number;
  bestStreakThisWeek: { habitName: string; streak: number };
}

/**
 * Pure generator for weekly review dashboard data.
 */
export function generateWeeklyReview(
  habits: Habit[],
  completions: Completion[],
  freezeDays: FreezeDay[],
  moods: MoodEntry[],
  today: string,
  weekStartsOn: 0 | 1 = 1
): WeeklyReviewData {
  const currentWeekStart = getWeekStart(today, weekStartsOn);
  const currentWeekEnd = getWeekEnd(currentWeekStart, weekStartsOn);

  // Previous week (S-1)
  const prevWeekStart = subtractDays(currentWeekStart, 7);

  const activeHabits = habits.filter((h) => !h.isArchived);

  // Helper to count expected and completed in a date range
  const evaluateWeek = (start: string) => {
    let totalExpected = 0;
    let totalCompleted = 0;
    const habitStats = new Map<string, { expected: number; completed: number }>();

    activeHabits.forEach((h) => habitStats.set(h.id, { expected: 0, completed: 0 }));

    // Loop 7 days
    let d = start;
    for (let i = 0; i < 7; i++) {
      const dow = getDayOfWeek(d);

      activeHabits.forEach((h) => {
        let isExpected = true;
        if (h.frequencyType === 'weekly_fixed') {
          const days = (h.frequencyConfig as { days: number[] }).days || [];
          isExpected = days.includes(dow);
        } else if (h.restDays && h.restDays.includes(dow)) {
          isExpected = false;
        }

        if (isExpected) {
          totalExpected++;
          const stats = habitStats.get(h.id)!;
          stats.expected++;

          const hasCompleted = completions.some(
            (c) =>
              c.habitId === h.id &&
              c.date === d &&
              (h.targetType === 'numeric' && h.targetValue
                ? c.value >= h.targetValue
                : c.value >= 1)
          );

          if (hasCompleted) {
            totalCompleted++;
            stats.completed++;
          }
        }
      });

      d = subtractDays(d, -1);
    }

    const rate = totalExpected > 0 ? Math.round((totalCompleted / totalExpected) * 100) : 0;
    return { rate, totalCompleted, habitStats };
  };

  const curWeekEval = evaluateWeek(currentWeekStart);
  const prevWeekEval = evaluateWeek(prevWeekStart);

  // Rank habits
  const habitPerformance = activeHabits.map((habit) => {
    const stats = curWeekEval.habitStats.get(habit.id) || { expected: 1, completed: 0 };
    const rate = stats.expected > 0 ? Math.round((stats.completed / stats.expected) * 100) : 0;
    return {
      habit,
      completionCount: stats.completed,
      rate,
    };
  });

  const sortedHabits = [...habitPerformance].sort((a, b) => b.rate - a.rate);
  const topHabits = sortedHabits.filter((h) => h.rate >= 50).slice(0, 3);
  const strugglingHabits = [...sortedHabits]
    .reverse()
    .filter((h) => h.rate < 100)
    .slice(0, 3);

  // Mood in current week
  const weekMoods = moods.filter((m) => isInRange(m.date, currentWeekStart, currentWeekEnd));
  const avgMood =
    weekMoods.length > 0
      ? Number((weekMoods.reduce((sum, m) => sum + m.level, 0) / weekMoods.length).toFixed(1))
      : null;

  // Best streak
  let bestStreakHabitName = 'Aucune';
  let bestStreakVal = 0;
  activeHabits.forEach((h) => {
    const hComps = completions.filter((c) => c.habitId === h.id);
    const hFreezes = freezeDays.filter((f) => f.habitId === h.id);
    const s = calculateStreak(h, hComps, hFreezes, { today, weekStartsOn });
    if (s.current > bestStreakVal) {
      bestStreakVal = s.current;
      bestStreakHabitName = h.name;
    }
  });

  return {
    weekStart: currentWeekStart,
    weekEnd: currentWeekEnd,
    completionRate: curWeekEval.rate,
    previousWeekRate: prevWeekEval.rate,
    rateDelta: curWeekEval.rate - prevWeekEval.rate,
    totalCompletionsThisWeek: curWeekEval.totalCompleted,
    topHabits,
    strugglingHabits,
    averageMood: avgMood,
    moodCount: weekMoods.length,
    bestStreakThisWeek: { habitName: bestStreakHabitName, streak: bestStreakVal },
  };
}
