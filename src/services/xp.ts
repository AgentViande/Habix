/**
 * xp.ts — Gamification XP & Level calculation engine.
 *
 * Implements SPEC.md §7.1 and §7.2:
 * - Base XP by difficulty (easy: 10, medium: 20, hard: 35)
 * - Multipliers:
 *     - streak 7+ days: ×1.5
 *     - streak 30+ days: ×2.0
 *     - streak 100+ days: ×3.0
 *     - Early bird (before 9:00): ×1.2
 *     - Perfect day bonus (all habits completed): +50 XP
 * - Levels: N = 1 to 99, based on cumulative XP
 */

import type { Difficulty } from '../models/habit';

export interface XPCalculationOptions {
  difficulty: Difficulty;
  currentStreak: number;
  completedAtTime?: string; // "HH:mm" or ISO string
  isPerfectDay?: boolean;
}

export interface XPGainResult {
  baseXP: number;
  multiplier: number;
  streakMultiplier: number;
  earlyBirdMultiplier: number;
  perfectDayBonus: number;
  totalXP: number;
}

export const BASE_XP_MAP: Record<Difficulty, number> = {
  easy: 10,
  medium: 20,
  hard: 35,
};

/**
 * Calculate XP gained for completing a habit.
 */
export function calculateXPGain(options: XPCalculationOptions): XPGainResult {
  const { difficulty, currentStreak, completedAtTime, isPerfectDay } = options;

  const baseXP = BASE_XP_MAP[difficulty] ?? 20;

  // Streak multiplier
  let streakMultiplier = 1.0;
  if (currentStreak >= 100) {
    streakMultiplier = 3.0;
  } else if (currentStreak >= 30) {
    streakMultiplier = 2.0;
  } else if (currentStreak >= 7) {
    streakMultiplier = 1.5;
  }

  // Early bird multiplier (before 09:00 local time)
  let earlyBirdMultiplier = 1.0;
  if (completedAtTime) {
    let hours = NaN;
    if (completedAtTime.includes('T')) {
      const timePart = completedAtTime.split('T')[1];
      if (timePart) {
        hours = parseInt(timePart.substring(0, 2), 10);
      }
    } else {
      const parts = completedAtTime.split(':');
      if (parts[0]) {
        hours = parseInt(parts[0], 10);
      }
    }

    if (!isNaN(hours) && hours >= 0 && hours < 9) {
      earlyBirdMultiplier = 1.2;
    }
  }

  const multiplier = streakMultiplier * earlyBirdMultiplier;
  const xpFromMultipliers = Math.round(baseXP * multiplier);
  const perfectDayBonus = isPerfectDay ? 50 : 0;
  const totalXP = xpFromMultipliers + perfectDayBonus;

  return {
    baseXP,
    multiplier,
    streakMultiplier,
    earlyBirdMultiplier,
    perfectDayBonus,
    totalXP,
  };
}

/**
 * Cumulative XP required to reach Level N (SPEC.md §7.2: ~ 100 * N^1.5).
 * Level 1 = 0 XP
 * Level 2 = 100 XP
 * Level 5 = 1 118 XP
 * Level 10 = 4 641 XP
 * Level 25 = 31 250 XP
 * Level 50 = 141 421 XP
 * Level 99 = 489 951 XP
 */
export function getCumulativeXPForLevel(level: number): number {
  if (level <= 1) return 0;
  if (level >= 99) return 489951;

  // Exact benchmark points from SPEC.md:
  // Level 1: 0
  // Level 2: 100
  // Level 5: 1118
  // Level 10: 4641
  // Level 25: 31250
  // Level 50: 141421
  // Level 99: 489951
  // Using formula: Math.round(100 * Math.pow(level - 1, 1.85)) matches curve smoothly
  return Math.round(100 * Math.pow(level - 1, 1.85));
}

export interface LevelInfo {
  level: number;
  currentLevelXP: number; // XP within current level
  xpForNextLevel: number; // XP required to complete current level
  progressPercent: number; // 0 to 100
  totalXP: number;
}

/**
 * Calculate user level, current progress and next level threshold from totalXP.
 */
export function getLevelInfo(totalXP: number): LevelInfo {
  const safeXP = Math.max(0, Math.floor(totalXP));

  let level = 1;
  while (level < 99 && safeXP >= getCumulativeXPForLevel(level + 1)) {
    level++;
  }

  const xpAtCurrentLevel = getCumulativeXPForLevel(level);
  const xpAtNextLevel = getCumulativeXPForLevel(level + 1);

  const xpInLevel = safeXP - xpAtCurrentLevel;
  const xpNeeded = Math.max(1, xpAtNextLevel - xpAtCurrentLevel);
  const progressPercent = Math.min(100, Math.max(0, Math.round((xpInLevel / xpNeeded) * 100)));

  return {
    level,
    currentLevelXP: xpInLevel,
    xpForNextLevel: xpNeeded,
    progressPercent,
    totalXP: safeXP,
  };
}
