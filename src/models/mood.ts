export interface MoodEntry {
  id: string;
  /** Local date "YYYY-MM-DD" */
  date: string;
  level: 1 | 2 | 3 | 4 | 5;
  tags: string[];
  note: string;
  createdAt: Date;
}
