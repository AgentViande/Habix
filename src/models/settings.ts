export type ThemeMode = 'light' | 'dark' | 'system';
export type WeekDay =
  'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday';

export interface Settings {
  /** Always "default" */
  id: string;
  theme: ThemeMode;
  /** How many days back a user can retroactively complete (1-30) */
  retroactiveDays: number;
  weekStartDay: WeekDay;
  reviewDay: WeekDay;
  /** "HH:mm" */
  eveningReminderTime: string;
  showMoodPopup: boolean;
  /** IANA timezone, e.g. "Europe/Paris" */
  timezone: string;
  customMoodTags: string[];
}
