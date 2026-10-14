import { db } from '../index';
import type { MoodEntry } from '../../models/mood';

export class MoodRepository {
  async getAll(): Promise<MoodEntry[]> {
    return db.moods.orderBy('date').reverse().toArray();
  }

  async getByDate(date: string): Promise<MoodEntry | undefined> {
    return db.moods.where('date').equals(date).first();
  }

  async getByDateRange(startDate: string, endDate: string): Promise<MoodEntry[]> {
    return db.moods.where('date').between(startDate, endDate, true, true).toArray();
  }

  async save(mood: MoodEntry): Promise<string> {
    await db.moods.put(mood);
    return mood.id;
  }

  async delete(id: string): Promise<void> {
    await db.moods.delete(id);
  }

  async deleteByDate(date: string): Promise<void> {
    await db.moods.where('date').equals(date).delete();
  }
}

export const moodRepository = new MoodRepository();
