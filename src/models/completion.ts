export interface Completion {
  id: string;
  habitId: string;
  /** Local date "YYYY-MM-DD" */
  date: string;
  /** 1 for boolean habits, numeric value for numeric habits */
  value: number;
  isRetroactive: boolean;
  /** Actual timestamp of when the completion was recorded */
  completedAt: Date;
}
