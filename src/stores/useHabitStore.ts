import { create } from 'zustand';
import type { Habit } from '../models/habit';
import type { Completion } from '../models/completion';
import type { FreezeDay } from '../models/freeze-day';
import type { Category } from '../models/category';
import { db } from '../db';
import { habitRepository } from '../db/repositories/habit.repository';
import { completionRepository } from '../db/repositories/completion.repository';

export interface HabitStoreState {
  habits: Habit[];
  categories: Category[];
  completions: Completion[];
  freezeDays: FreezeDay[];
  isLoading: boolean;
  error: string | null;

  // Actions
  loadAll: () => Promise<void>;
  createHabit: (
    habitData: Omit<Habit, 'id' | 'createdAt' | 'sortOrder' | 'isArchived'>
  ) => Promise<string>;
  updateHabit: (id: string, updates: Partial<Habit>) => Promise<void>;
  archiveHabit: (id: string) => Promise<void>;
  restoreHabit: (id: string) => Promise<void>;
  deleteHabit: (id: string) => Promise<void>;
  reorderHabits: (orderedIds: string[]) => Promise<void>;

  toggleCompletion: (habitId: string, date: string, isRetroactive?: boolean) => Promise<void>;
  setNumericValue: (
    habitId: string,
    date: string,
    value: number,
    isRetroactive?: boolean
  ) => Promise<void>;
  freezeDay: (habitId: string, date: string) => Promise<void>;
  unfreezeDay: (habitId: string, date: string) => Promise<void>;
}

export const useHabitStore = create<HabitStoreState>((set, get) => ({
  habits: [],
  categories: [],
  completions: [],
  freezeDays: [],
  isLoading: false,
  error: null,

  loadAll: async () => {
    set({ isLoading: true, error: null });
    try {
      const [habits, categories, completions, freezeDays] = await Promise.all([
        habitRepository.getAll(),
        db.categories.orderBy('sortOrder').toArray(),
        completionRepository.getAll(),
        completionRepository.getAllFreezeDays(),
      ]);
      set({ habits, categories, completions, freezeDays, isLoading: false });
    } catch (err: unknown) {
      set({ error: (err as Error).message || 'Failed to load habit data', isLoading: false });
    }
  },

  createHabit: async (habitData) => {
    const existing = get().habits;
    const maxSortOrder = existing.reduce((max, h) => Math.max(max, h.sortOrder), -1);

    const newHabit: Habit = {
      ...habitData,
      id: `habit-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      isArchived: false,
      createdAt: new Date(),
      sortOrder: maxSortOrder + 1,
    };

    await habitRepository.create(newHabit);
    set((state) => ({ habits: [...state.habits, newHabit] }));
    return newHabit.id;
  },

  updateHabit: async (id, updates) => {
    await habitRepository.update(id, updates);
    set((state) => ({
      habits: state.habits.map((h) => (h.id === id ? { ...h, ...updates } : h)),
    }));
  },

  archiveHabit: async (id) => {
    await habitRepository.archive(id);
    set((state) => ({
      habits: state.habits.map((h) => (h.id === id ? { ...h, isArchived: true } : h)),
    }));
  },

  restoreHabit: async (id) => {
    await habitRepository.restore(id);
    set((state) => ({
      habits: state.habits.map((h) => (h.id === id ? { ...h, isArchived: false } : h)),
    }));
  },

  deleteHabit: async (id) => {
    await habitRepository.delete(id);
    set((state) => ({
      habits: state.habits.filter((h) => h.id !== id),
      completions: state.completions.filter((c) => c.habitId !== id),
      freezeDays: state.freezeDays.filter((f) => f.habitId !== id),
    }));
  },

  reorderHabits: async (orderedIds) => {
    await habitRepository.updateSortOrders(orderedIds);
    set((state) => {
      const orderMap = new Map(orderedIds.map((id, index) => [id, index]));
      const updated = state.habits.map((h) => {
        const newOrder = orderMap.get(h.id);
        return newOrder !== undefined ? { ...h, sortOrder: newOrder } : h;
      });
      updated.sort((a, b) => a.sortOrder - b.sortOrder);
      return { habits: updated };
    });
  },

  toggleCompletion: async (habitId, date, isRetroactive = false) => {
    const existing = get().completions.find((c) => c.habitId === habitId && c.date === date);

    if (existing) {
      // Toggle off
      await completionRepository.delete(existing.id);
      set((state) => ({
        completions: state.completions.filter((c) => c.id !== existing.id),
      }));
    } else {
      // Toggle on (value 1)
      const newCompletion: Completion = {
        id: `comp-${habitId}-${date}`,
        habitId,
        date,
        value: 1,
        isRetroactive,
        completedAt: new Date(),
      };
      await completionRepository.save(newCompletion);

      // If that day was frozen, unfreeze it automatically
      const wasFrozen = get().freezeDays.some((f) => f.habitId === habitId && f.date === date);
      if (wasFrozen) {
        await completionRepository.removeFreezeDay(habitId, date);
      }

      set((state) => ({
        completions: [...state.completions, newCompletion],
        freezeDays: wasFrozen
          ? state.freezeDays.filter((f) => !(f.habitId === habitId && f.date === date))
          : state.freezeDays,
      }));
    }
  },

  setNumericValue: async (habitId, date, value, isRetroactive = false) => {
    if (value <= 0) {
      // Delete completion if value <= 0
      const existing = get().completions.find((c) => c.habitId === habitId && c.date === date);
      if (existing) {
        await completionRepository.delete(existing.id);
        set((state) => ({
          completions: state.completions.filter((c) => c.id !== existing.id),
        }));
      }
      return;
    }

    const newCompletion: Completion = {
      id: `comp-${habitId}-${date}`,
      habitId,
      date,
      value,
      isRetroactive,
      completedAt: new Date(),
    };

    await completionRepository.save(newCompletion);
    set((state) => {
      const filtered = state.completions.filter((c) => !(c.habitId === habitId && c.date === date));
      return { completions: [...filtered, newCompletion] };
    });
  },

  freezeDay: async (habitId, date) => {
    const existingFreeze = get().freezeDays.find((f) => f.habitId === habitId && f.date === date);
    if (existingFreeze) return;

    const newFreeze: FreezeDay = {
      id: `freeze-${habitId}-${date}`,
      habitId,
      date,
      createdAt: new Date(),
    };

    await completionRepository.addFreezeDay(newFreeze);
    set((state) => ({ freezeDays: [...state.freezeDays, newFreeze] }));
  },

  unfreezeDay: async (habitId, date) => {
    await completionRepository.removeFreezeDay(habitId, date);
    set((state) => ({
      freezeDays: state.freezeDays.filter((f) => !(f.habitId === habitId && f.date === date)),
    }));
  },
}));
