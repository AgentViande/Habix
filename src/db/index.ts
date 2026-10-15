import Dexie, { type Table } from 'dexie';
import type { Habit } from '../models/habit';
import type { Completion } from '../models/completion';
import type { Category } from '../models/category';
import type { MoodEntry } from '../models/mood';
import type { Challenge } from '../models/challenge';
import type { UnlockedBadge } from '../models/badge';
import type { UserProfile } from '../models/user-profile';
import type { FreezeDay } from '../models/freeze-day';
import type { Settings } from '../models/settings';
import type { XPEvent } from '../models/xp-event';

export class HabixDB extends Dexie {
  habits!: Table<Habit>;
  completions!: Table<Completion>;
  categories!: Table<Category>;
  moods!: Table<MoodEntry>;
  challenges!: Table<Challenge>;
  unlockedBadges!: Table<UnlockedBadge>;
  userProfile!: Table<UserProfile>;
  freezeDays!: Table<FreezeDay>;
  settings!: Table<Settings>;
  xpEvents!: Table<XPEvent>;

  constructor() {
    super('habix');

    this.version(1).stores({
      habits: 'id, categoryId, frequencyType, isArchived, sortOrder',
      completions: 'id, habitId, date, [habitId+date]',
      categories: 'id, sortOrder',
      moods: 'id, date',
      challenges: 'id, habitId, status, [habitId+status]',
      unlockedBadges: 'id, badgeId, unlockedAt',
      userProfile: 'id',
      freezeDays: 'id, habitId, date, [habitId+date]',
      settings: 'id',
    });

    this.version(2).stores({
      xpEvents: 'id, date, habitId, createdAt',
    });
  }
}

export const db = new HabixDB();
