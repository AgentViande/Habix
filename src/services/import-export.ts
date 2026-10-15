/**
 * import-export.ts — Secure validator and rehydrator for JSON backups.
 */

import type { Habit } from '../models/habit';
import type { Completion } from '../models/completion';
import type { Category } from '../models/category';
import type { FreezeDay } from '../models/freeze-day';
import type { MoodEntry } from '../models/mood';
import type { Challenge } from '../models/challenge';
import type { UnlockedBadge } from '../models/badge';
import type { UserProfile } from '../models/user-profile';
import type { Settings } from '../models/settings';
import type { XPEvent } from '../models/xp-event';

export interface ValidatedBackupData {
  habits: Habit[];
  completions: Completion[];
  categories: Category[];
  freezeDays: FreezeDay[];
  moods: MoodEntry[];
  challenges: Challenge[];
  unlockedBadges: UnlockedBadge[];
  userProfile?: UserProfile[];
  settings?: Settings[];
  xpEvents?: XPEvent[];
}

const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;

function isValidDateString(d: unknown): boolean {
  return typeof d === 'string' && DATE_REGEX.test(d);
}

function parseDateObject(val: unknown, fallback: Date = new Date()): Date {
  if (val instanceof Date && !isNaN(val.getTime())) return val;
  if (typeof val === 'string' || typeof val === 'number') {
    const d = new Date(val);
    if (!isNaN(d.getTime())) return d;
  }
  return fallback;
}

/**
 * Validates, sanitizes and rehydrates imported JSON backup data.
 * Throws a descriptive Error if data is corrupted or invalid.
 */
export function validateAndSanitizeBackup(raw: unknown): ValidatedBackupData {
  if (!raw || typeof raw !== 'object') {
    throw new Error('Le fichier sélectionné ne contient pas un objet JSON valide.');
  }

  const obj = raw as Record<string, unknown>;

  if (!Array.isArray(obj.habits)) {
    throw new Error('Le fichier de sauvegarde doit contenir une liste "habits" valide.');
  }

  // 1. Sanitize habits
  const validHabits: Habit[] = [];
  const validHabitIds = new Set<string>();

  for (let i = 0; i < obj.habits.length; i++) {
    const h = obj.habits[i];
    if (!h || typeof h !== 'object') continue;

    const id = typeof h.id === 'string' && h.id.trim() ? h.id.trim() : null;
    const name = typeof h.name === 'string' && h.name.trim() ? h.name.trim() : null;
    const freq = ['daily', 'weekly_fixed', 'weekly_flex', 'interval'].includes(h.frequencyType)
      ? h.frequencyType
      : 'daily';

    if (!id || !name) {
      throw new Error(`Habitude invalide à l'index ${i}: 'id' et 'name' sont obligatoires.`);
    }

    const sanitizedHabit: Habit = {
      id,
      name: name.slice(0, 100),
      description: typeof h.description === 'string' ? h.description.slice(0, 500) : '',
      icon: typeof h.icon === 'string' ? h.icon.slice(0, 10) : '⚡',
      color: typeof h.color === 'string' ? h.color.slice(0, 30) : '#818cf8',
      categoryId: typeof h.categoryId === 'string' ? h.categoryId : null,
      frequencyType: freq,
      frequencyConfig:
        typeof h.frequencyConfig === 'object' && h.frequencyConfig
          ? (h.frequencyConfig as Habit['frequencyConfig'])
          : { type: 'daily' },
      targetType: h.targetType === 'numeric' ? 'numeric' : 'boolean',
      targetValue: typeof h.targetValue === 'number' && h.targetValue > 0 ? h.targetValue : null,
      targetUnit: typeof h.targetUnit === 'string' ? h.targetUnit.slice(0, 30) : null,
      difficulty: ['easy', 'medium', 'hard'].includes(h.difficulty) ? h.difficulty : 'medium',
      reminderTime: typeof h.reminderTime === 'string' ? h.reminderTime : null,
      restDays: Array.isArray(h.restDays)
        ? h.restDays.filter((d: unknown) => typeof d === 'number' && d >= 0 && d <= 6)
        : [],
      isArchived: Boolean(h.isArchived),
      sortOrder: typeof h.sortOrder === 'number' ? h.sortOrder : i,
      createdAt: parseDateObject(h.createdAt),
    };

    validHabits.push(sanitizedHabit);
    validHabitIds.add(id);
  }

  // 2. Sanitize completions
  const validCompletions: Completion[] = [];
  if (Array.isArray(obj.completions)) {
    for (const c of obj.completions) {
      if (!c || typeof c !== 'object') continue;
      const id = typeof c.id === 'string' ? c.id : `comp-${c.habitId}-${c.date}`;
      const habitId = typeof c.habitId === 'string' ? c.habitId : null;
      const date = isValidDateString(c.date) ? c.date : null;

      if (habitId && date && validHabitIds.has(habitId)) {
        validCompletions.push({
          id,
          habitId,
          date,
          value: typeof c.value === 'number' && !isNaN(c.value) ? c.value : 1,
          isRetroactive: Boolean(c.isRetroactive),
          completedAt: parseDateObject(c.completedAt),
        });
      }
    }
  }

  // 3. Sanitize categories
  const validCategories: Category[] = [];
  if (Array.isArray(obj.categories)) {
    for (let i = 0; i < obj.categories.length; i++) {
      const cat = obj.categories[i];
      if (!cat || typeof cat !== 'object') continue;
      if (typeof cat.id === 'string' && typeof cat.name === 'string') {
        validCategories.push({
          id: cat.id,
          name: cat.name.slice(0, 60),
          icon: typeof cat.icon === 'string' ? cat.icon.slice(0, 10) : '📁',
          color: typeof cat.color === 'string' ? cat.color.slice(0, 30) : '#818cf8',
          sortOrder: typeof cat.sortOrder === 'number' ? cat.sortOrder : i,
        });
      }
    }
  }

  // 4. Sanitize freezeDays
  const validFreezeDays: FreezeDay[] = [];
  if (Array.isArray(obj.freezeDays)) {
    for (const f of obj.freezeDays) {
      if (!f || typeof f !== 'object') continue;
      const id = typeof f.id === 'string' ? f.id : `freeze-${f.habitId}-${f.date}`;
      const habitId = typeof f.habitId === 'string' ? f.habitId : null;
      const date = isValidDateString(f.date) ? f.date : null;

      if (habitId && date) {
        validFreezeDays.push({
          id,
          habitId,
          date,
          createdAt: parseDateObject(f.createdAt),
        });
      }
    }
  }

  // 5. Sanitize moods
  const validMoods: MoodEntry[] = [];
  if (Array.isArray(obj.moods)) {
    for (const m of obj.moods) {
      if (!m || typeof m !== 'object') continue;
      const id = typeof m.id === 'string' ? m.id : `mood-${m.date}`;
      const date = isValidDateString(m.date) ? m.date : null;
      const level = [1, 2, 3, 4, 5].includes(m.level) ? (m.level as 1 | 2 | 3 | 4 | 5) : 3;

      if (date) {
        validMoods.push({
          id,
          date,
          level,
          note: typeof m.note === 'string' ? m.note.slice(0, 500) : undefined,
          tags: Array.isArray(m.tags)
            ? m.tags.filter((t: unknown) => typeof t === 'string').slice(0, 10)
            : [],
          createdAt: parseDateObject(m.createdAt),
        });
      }
    }
  }

  // 6. Sanitize challenges
  const validChallenges: Challenge[] = [];
  if (Array.isArray(obj.challenges)) {
    for (const ch of obj.challenges) {
      if (!ch || typeof ch !== 'object') continue;
      const id = typeof ch.id === 'string' ? ch.id : `ch-${Date.now()}`;
      const habitId = typeof ch.habitId === 'string' ? ch.habitId : null;
      const duration = ch.duration === 21 || ch.duration === 30 ? ch.duration : 21;
      const startDate = isValidDateString(ch.startDate) ? ch.startDate : null;
      const status = ['active', 'completed', 'failed', 'abandoned'].includes(ch.status)
        ? ch.status
        : 'active';

      if (habitId && startDate) {
        validChallenges.push({
          id,
          habitId,
          duration,
          startDate,
          currentDay: typeof ch.currentDay === 'number' && ch.currentDay >= 1 ? ch.currentDay : 1,
          status,
          completedAt: ch.completedAt ? parseDateObject(ch.completedAt) : null,
        });
      }
    }
  }

  // 7. Sanitize unlockedBadges
  const validBadges: UnlockedBadge[] = [];
  if (Array.isArray(obj.unlockedBadges)) {
    for (const b of obj.unlockedBadges) {
      if (!b || typeof b !== 'object') continue;
      if (typeof b.id === 'string' && typeof b.badgeId === 'string') {
        validBadges.push({
          id: b.id,
          badgeId: b.badgeId,
          unlockedAt: parseDateObject(b.unlockedAt),
        });
      }
    }
  }

  // 8. Sanitize userProfile
  let validUserProfile: UserProfile[] | undefined;
  if (Array.isArray(obj.userProfile) && obj.userProfile.length > 0) {
    const p = obj.userProfile[0];
    if (p && typeof p === 'object') {
      validUserProfile = [
        {
          id: typeof p.id === 'string' ? p.id : 'default',
          displayName:
            typeof p.displayName === 'string' ? p.displayName.slice(0, 50) : 'Aventurier',
          totalXP: typeof p.totalXP === 'number' && p.totalXP >= 0 ? p.totalXP : 0,
          currentLevel:
            typeof p.currentLevel === 'number' && p.currentLevel >= 1 ? p.currentLevel : 1,
          selectedTitle: typeof p.selectedTitle === 'string' ? p.selectedTitle : 'Novice',
          availableFreezeDays:
            typeof p.availableFreezeDays === 'number' && p.availableFreezeDays >= 0
              ? p.availableFreezeDays
              : 3,
          createdAt: parseDateObject(p.createdAt),
        },
      ];
    }
  }

  // 9. Sanitize settings
  let validSettings: Settings[] | undefined;
  if (Array.isArray(obj.settings) && obj.settings.length > 0) {
    const s = obj.settings[0];
    if (s && typeof s === 'object') {
      validSettings = [
        {
          id: typeof s.id === 'string' ? s.id : 'default',
          theme: ['light', 'dark', 'system'].includes(s.theme) ? s.theme : 'dark',
          weekStartDay: s.weekStartDay === 'sunday' ? 'sunday' : 'monday',
          reviewDay: s.reviewDay === 'sunday' ? 'sunday' : 'monday',
          timezone:
            typeof s.timezone === 'string'
              ? s.timezone
              : Intl.DateTimeFormat().resolvedOptions().timeZone,
          eveningReminderTime:
            typeof s.eveningReminderTime === 'string' ? s.eveningReminderTime : '21:00',
          retroactiveDays: typeof s.retroactiveDays === 'number' ? s.retroactiveDays : 7,
          showMoodPopup: typeof s.showMoodPopup === 'boolean' ? s.showMoodPopup : true,
          customMoodTags: Array.isArray(s.customMoodTags)
            ? s.customMoodTags.filter((t: unknown) => typeof t === 'string')
            : [],
          userName: typeof s.userName === 'string' ? s.userName.slice(0, 30).trim() : '',
          soundEnabled: typeof s.soundEnabled === 'boolean' ? s.soundEnabled : true,
          soundVolume:
            typeof s.soundVolume === 'number' && s.soundVolume >= 0 && s.soundVolume <= 1
              ? s.soundVolume
              : 0.2,
          animationsEnabled: typeof s.animationsEnabled === 'boolean' ? s.animationsEnabled : true,
          showDailyQuote: typeof s.showDailyQuote === 'boolean' ? s.showDailyQuote : true,
        },
      ];
    }
  }

  // 10. Sanitize xpEvents (if present)
  const validXpEvents: XPEvent[] = [];
  if (Array.isArray(obj.xpEvents)) {
    for (const x of obj.xpEvents) {
      if (!x || typeof x !== 'object') continue;
      if (typeof x.id === 'string' && isValidDateString(x.date) && typeof x.amount === 'number') {
        validXpEvents.push({
          id: x.id,
          date: x.date,
          amount: x.amount,
          reason: ['habit_completion', 'perfect_day', 'challenge', 'bonus'].includes(x.reason)
            ? x.reason
            : 'bonus',
          habitId: typeof x.habitId === 'string' ? x.habitId : undefined,
          habitName: typeof x.habitName === 'string' ? x.habitName.slice(0, 100) : undefined,
          createdAt: parseDateObject(x.createdAt),
        });
      }
    }
  }

  return {
    habits: validHabits,
    completions: validCompletions,
    categories: validCategories,
    freezeDays: validFreezeDays,
    moods: validMoods,
    challenges: validChallenges,
    unlockedBadges: validBadges,
    userProfile: validUserProfile,
    settings: validSettings,
    xpEvents: validXpEvents.length ? validXpEvents : undefined,
  };
}
