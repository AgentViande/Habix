export type XPReason = 'habit_completion' | 'perfect_day' | 'challenge' | 'bonus';

export interface XPEvent {
  id: string;
  date: string; // YYYY-MM-DD (local midnight-to-midnight)
  amount: number;
  reason: XPReason;
  habitId?: string;
  habitName?: string;
  createdAt: Date;
}
