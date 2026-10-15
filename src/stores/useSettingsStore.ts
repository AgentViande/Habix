import { create } from 'zustand';
import type { Settings } from '../models/settings';
import { db } from '../db';

export interface SettingsStoreState {
  settings: Settings;
  isLoading: boolean;

  loadSettings: () => Promise<void>;
  updateSettings: (partial: Partial<Settings>) => Promise<void>;
}

const DEFAULT_SETTINGS: Settings = {
  id: 'default',
  theme: 'dark',
  retroactiveDays: 7,
  weekStartDay: 'monday',
  reviewDay: 'sunday',
  eveningReminderTime: '21:00',
  showMoodPopup: true,
  timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'Europe/Paris',
  customMoodTags: ['travail', 'sport', 'famille', 'sommeil', 'méditation'],
  userName: '',
  soundEnabled: true,
  soundVolume: 0.2,
  animationsEnabled: true,
  showDailyQuote: true,
};

export const useSettingsStore = create<SettingsStoreState>((set, get) => ({
  settings: DEFAULT_SETTINGS,
  isLoading: false,

  loadSettings: async () => {
    set({ isLoading: true });
    let settings = await db.settings.get('default');
    if (!settings) {
      settings = DEFAULT_SETTINGS;
      await db.settings.put(settings);
    } else {
      // Ensure any newly added settings are merged in
      settings = { ...DEFAULT_SETTINGS, ...settings };
    }
    set({ settings, isLoading: false });
  },

  updateSettings: async (partial) => {
    const current = get().settings;
    const updated: Settings = { ...current, ...partial };
    await db.settings.put(updated);
    set({ settings: updated });
  },
}));
