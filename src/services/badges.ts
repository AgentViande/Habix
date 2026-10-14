import type { Habit } from '../models/habit';
import type { Completion } from '../models/completion';
import type { FreezeDay } from '../models/freeze-day';
import type { MoodEntry } from '../models/mood';
import type { Challenge } from '../models/challenge';
import { calculateStreak } from '../lib/streaks';
import { BADGE_DEFINITIONS } from '../constants/badges';

export interface BadgeEvaluationContext {
  habits: Habit[];
  completions: Completion[];
  freezeDays: FreezeDay[];
  moods: MoodEntry[];
  currentLevel: number;
  challenges: Challenge[];
  unlockedBadgeIds: Set<string>;
  today: string;
  weekStartsOn: 0 | 1;
}

/**
 * Pure function that evaluates which badges are newly unlocked based on current state.
 * Returns array of newly unlocked BadgeDefinition objects.
 */
export function evaluateNewBadges(context: BadgeEvaluationContext) {
  const {
    habits,
    completions,
    freezeDays,
    moods,
    currentLevel,
    challenges,
    unlockedBadgeIds,
    today,
    weekStartsOn,
  } = context;

  const newlyUnlocked: string[] = [];

  // Helper: has not unlocked yet
  const canUnlock = (id: string) => !unlockedBadgeIds.has(id);

  // 1. Completion counts
  const totalCompletions = completions.filter((c) => c.value >= 1).length;
  if (canUnlock('comp_1') && totalCompletions >= 1) newlyUnlocked.push('comp_1');
  if (canUnlock('comp_100') && totalCompletions >= 100) newlyUnlocked.push('comp_100');
  if (canUnlock('comp_1000') && totalCompletions >= 1000) newlyUnlocked.push('comp_1000');
  if (canUnlock('comp_10000') && totalCompletions >= 10000) newlyUnlocked.push('comp_10000');

  // 2. Streaks
  let maxBestStreak = 0;
  habits.forEach((h) => {
    const hComps = completions.filter((c) => c.habitId === h.id);
    const hFreezes = freezeDays.filter((f) => f.habitId === h.id);
    const s = calculateStreak(h, hComps, hFreezes, { today, weekStartsOn });
    if (s.best > maxBestStreak) maxBestStreak = s.best;
  });

  if (canUnlock('streak_3') && maxBestStreak >= 3) newlyUnlocked.push('streak_3');
  if (canUnlock('streak_7') && maxBestStreak >= 7) newlyUnlocked.push('streak_7');
  if (canUnlock('streak_30') && maxBestStreak >= 30) newlyUnlocked.push('streak_30');
  if (canUnlock('streak_90') && maxBestStreak >= 90) newlyUnlocked.push('streak_90');
  if (canUnlock('streak_365') && maxBestStreak >= 365) newlyUnlocked.push('streak_365');

  // 2b. Regularity
  const activeHabits = habits.filter((h) => !h.isArchived);
  if (activeHabits.length > 0) {
    const allHave7DayStreak = activeHabits.every((h) => {
      const hComps = completions.filter((c) => c.habitId === h.id);
      const hFreezes = freezeDays.filter((f) => f.habitId === h.id);
      const s = calculateStreak(h, hComps, hFreezes, { today, weekStartsOn });
      return s.best >= 7;
    });
    if (canUnlock('perfect_week') && allHave7DayStreak) newlyUnlocked.push('perfect_week');

    const allHave30DayStreak = activeHabits.every((h) => {
      const hComps = completions.filter((c) => c.habitId === h.id);
      const hFreezes = freezeDays.filter((f) => f.habitId === h.id);
      const s = calculateStreak(h, hComps, hFreezes, { today, weekStartsOn });
      return s.best >= 30;
    });
    if (canUnlock('perfect_month') && allHave30DayStreak) newlyUnlocked.push('perfect_month');
  }

  // 3. Level
  if (canUnlock('level_5') && currentLevel >= 5) newlyUnlocked.push('level_5');
  if (canUnlock('level_10') && currentLevel >= 10) newlyUnlocked.push('level_10');
  if (canUnlock('level_25') && currentLevel >= 25) newlyUnlocked.push('level_25');
  if (canUnlock('level_50') && currentLevel >= 50) newlyUnlocked.push('level_50');

  // 4. Time of completion (early bird / night owl)
  let earlyBirdCount = 0;
  let nightOwlCount = 0;
  completions.forEach((c) => {
    if (c.completedAt) {
      const date = new Date(c.completedAt);
      const hours = date.getHours();
      if (hours < 9) earlyBirdCount++;
      if (hours >= 22) nightOwlCount++;
    }
  });

  if (canUnlock('early_bird') && earlyBirdCount >= 50) newlyUnlocked.push('early_bird');
  if (canUnlock('night_owl') && nightOwlCount >= 50) newlyUnlocked.push('night_owl');

  // 5. Habits diversity
  if (canUnlock('active_5') && activeHabits.length >= 5) newlyUnlocked.push('active_5');
  if (canUnlock('habits_10') && habits.length >= 10) newlyUnlocked.push('habits_10');

  const categoriesUsed = new Set(habits.map((h) => h.categoryId).filter(Boolean));
  if (canUnlock('categories_4') && categoriesUsed.size >= 4) newlyUnlocked.push('categories_4');

  // 6. Freeze days
  if (canUnlock('freeze_1') && freezeDays.length >= 1) newlyUnlocked.push('freeze_1');
  if (canUnlock('freeze_master') && freezeDays.length >= 5) newlyUnlocked.push('freeze_master');

  // 7. Mood entries
  if (canUnlock('mood_7') && moods.length >= 7) newlyUnlocked.push('mood_7');
  if (canUnlock('mood_30') && moods.length >= 30) newlyUnlocked.push('mood_30');

  // 8. Challenges
  const completed21 = challenges.some((c) => c.duration === 21 && c.status === 'completed');
  if (canUnlock('challenge_21') && completed21) newlyUnlocked.push('challenge_21');

  const completed30 = challenges.some((c) => c.duration === 30 && c.status === 'completed');
  if (canUnlock('challenge_30') && completed30) newlyUnlocked.push('challenge_30');

  return BADGE_DEFINITIONS.filter((b) => newlyUnlocked.includes(b.id));
}
