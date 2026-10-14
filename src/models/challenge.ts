export type ChallengeStatus = 'active' | 'completed' | 'failed' | 'abandoned';

export interface Challenge {
  id: string;
  habitId: string;
  duration: 21 | 30;
  /** Local date "YYYY-MM-DD" */
  startDate: string;
  /** 1-based progress counter */
  currentDay: number;
  status: ChallengeStatus;
  completedAt: Date | null;
}
