import { db } from '../index';
import type { Completion } from '../../models/completion';
import type { FreezeDay } from '../../models/freeze-day';

export class CompletionRepository {
  async getAll(): Promise<Completion[]> {
    return db.completions.toArray();
  }

  async getByHabitId(habitId: string): Promise<Completion[]> {
    return db.completions.where('habitId').equals(habitId).toArray();
  }

  async getByDate(date: string): Promise<Completion[]> {
    return db.completions.where('date').equals(date).toArray();
  }

  async getByHabitAndDate(habitId: string, date: string): Promise<Completion | undefined> {
    return db.completions.where('[habitId+date]').equals([habitId, date]).first();
  }

  async getByDateRange(startDate: string, endDate: string): Promise<Completion[]> {
    return db.completions.where('date').between(startDate, endDate, true, true).toArray();
  }

  async save(completion: Completion): Promise<string> {
    await db.completions.put(completion);
    return completion.id;
  }

  async delete(id: string): Promise<void> {
    await db.completions.delete(id);
  }

  async deleteByHabitAndDate(habitId: string, date: string): Promise<void> {
    await db.completions.where('[habitId+date]').equals([habitId, date]).delete();
  }

  // Freeze days management
  async getAllFreezeDays(): Promise<FreezeDay[]> {
    return db.freezeDays.toArray();
  }

  async getFreezeDaysByHabitId(habitId: string): Promise<FreezeDay[]> {
    return db.freezeDays.where('habitId').equals(habitId).toArray();
  }

  async getFreezeDay(habitId: string, date: string): Promise<FreezeDay | undefined> {
    return db.freezeDays.where('[habitId+date]').equals([habitId, date]).first();
  }

  async addFreezeDay(freezeDay: FreezeDay): Promise<string> {
    await db.freezeDays.put(freezeDay);
    return freezeDay.id;
  }

  async removeFreezeDay(habitId: string, date: string): Promise<void> {
    await db.freezeDays.where('[habitId+date]').equals([habitId, date]).delete();
  }
}

export const completionRepository = new CompletionRepository();
