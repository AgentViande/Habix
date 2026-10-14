import { db } from '../index';
import type { Habit } from '../../models/habit';

export class HabitRepository {
  async getAll(): Promise<Habit[]> {
    return db.habits.orderBy('sortOrder').toArray();
  }

  async getActive(): Promise<Habit[]> {
    return db.habits.filter((h) => !h.isArchived).sortBy('sortOrder');
  }

  async getArchived(): Promise<Habit[]> {
    return db.habits.filter((h) => h.isArchived).sortBy('sortOrder');
  }

  async getById(id: string): Promise<Habit | undefined> {
    return db.habits.get(id);
  }

  async getByCategoryId(categoryId: string | null): Promise<Habit[]> {
    if (categoryId === null) {
      return db.habits.filter((h) => h.categoryId === null && !h.isArchived).sortBy('sortOrder');
    }
    return db.habits
      .where('categoryId')
      .equals(categoryId)
      .filter((h) => !h.isArchived)
      .sortBy('sortOrder');
  }

  async create(habit: Habit): Promise<string> {
    return db.habits.add(habit);
  }

  async update(id: string, updates: Partial<Habit>): Promise<number> {
    return db.habits.update(id, updates);
  }

  async archive(id: string): Promise<number> {
    return db.habits.update(id, { isArchived: true });
  }

  async restore(id: string): Promise<number> {
    return db.habits.update(id, { isArchived: false });
  }

  async delete(id: string): Promise<void> {
    await db.transaction(
      'rw',
      [db.habits, db.completions, db.freezeDays, db.challenges],
      async () => {
        await db.habits.delete(id);
        await db.completions.where('habitId').equals(id).delete();
        await db.freezeDays.where('habitId').equals(id).delete();
        await db.challenges.where('habitId').equals(id).delete();
      }
    );
  }

  async updateSortOrders(orderedIds: string[]): Promise<void> {
    await db.transaction('rw', db.habits, async () => {
      for (let i = 0; i < orderedIds.length; i++) {
        await db.habits.update(orderedIds[i], { sortOrder: i });
      }
    });
  }
}

export const habitRepository = new HabitRepository();
