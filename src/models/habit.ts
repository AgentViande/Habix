export type FrequencyType = 'daily' | 'weekly_fixed' | 'weekly_flex' | 'interval';
export type TargetType = 'boolean' | 'numeric';
export type Difficulty = 'easy' | 'medium' | 'hard';

export interface FrequencyConfigDaily {
  type: 'daily';
}

export interface FrequencyConfigWeeklyFixed {
  type: 'weekly_fixed';
  /** Days of week: 0=Sunday, 1=Monday … 6=Saturday */
  days: number[];
}

export interface FrequencyConfigWeeklyFlex {
  type: 'weekly_flex';
  timesPerWeek: number;
}

export interface FrequencyConfigInterval {
  type: 'interval';
  everyNDays: number;
}

export type FrequencyConfig =
  | FrequencyConfigDaily
  | FrequencyConfigWeeklyFixed
  | FrequencyConfigWeeklyFlex
  | FrequencyConfigInterval;

export interface Habit {
  id: string;
  name: string;
  description: string;
  icon: string; // emoji
  color: string; // hex
  categoryId: string | null;
  frequencyType: FrequencyType;
  frequencyConfig: FrequencyConfig;
  targetType: TargetType;
  targetValue: number | null; // null for boolean
  targetUnit: string | null; // null for boolean
  difficulty: Difficulty;
  reminderTime: string | null; // "HH:mm" or null
  restDays: number[]; // rest days (0=Sun … 6=Sat)
  isArchived: boolean;
  createdAt: Date;
  sortOrder: number;
}
