import { create } from 'zustand';
import type { MoodEntry } from '../models/mood';
import { moodRepository } from '../db/repositories/mood.repository';

export interface MoodStoreState {
  moods: MoodEntry[];
  isLoading: boolean;
  loadMoods: () => Promise<void>;
  saveMood: (entry: Omit<MoodEntry, 'id' | 'createdAt'>) => Promise<string>;
  deleteMood: (id: string) => Promise<void>;
  getMoodForDate: (date: string) => MoodEntry | undefined;
}

export const useMoodStore = create<MoodStoreState>((set, get) => ({
  moods: [],
  isLoading: false,

  loadMoods: async () => {
    set({ isLoading: true });
    const moods = await moodRepository.getAll();
    set({ moods, isLoading: false });
  },

  saveMood: async (entry) => {
    const existing = get().moods.find((m) => m.date === entry.date);
    const moodToSave: MoodEntry = {
      ...entry,
      id: existing ? existing.id : `mood-${entry.date}`,
      createdAt: existing ? existing.createdAt : new Date(),
    };

    await moodRepository.save(moodToSave);
    set((state) => ({
      moods: [moodToSave, ...state.moods.filter((m) => m.date !== entry.date)],
    }));
    return moodToSave.id;
  },

  deleteMood: async (id) => {
    await moodRepository.delete(id);
    set((state) => ({
      moods: state.moods.filter((m) => m.id !== id),
    }));
  },

  getMoodForDate: (date: string) => {
    return get().moods.find((m) => m.date === date);
  },
}));
