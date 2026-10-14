import { describe, it, expect, beforeEach } from 'vitest';
import { db } from '../index';
import { habitRepository } from './habit.repository';
import { completionRepository } from './completion.repository';
import { moodRepository } from './mood.repository';
import { badgeRepository } from './badge.repository';
import type { Habit } from '../../models/habit';

describe('Dexie Repositories with fake-indexeddb', () => {
  beforeEach(async () => {
    await db.habits.clear();
    await db.completions.clear();
    await db.freezeDays.clear();
    await db.moods.clear();
    await db.unlockedBadges.clear();
  });

  it('HabitRepository: creates, retrieves active, updates, and deletes cascadingly', () => {
    return (async () => {
      const habit: Habit = {
        id: 'h-1',
        name: 'Lecture',
        description: 'Lire 20 pages',
        icon: '📚',
        color: '#10b981',
        categoryId: null,
        frequencyType: 'daily',
        frequencyConfig: { type: 'daily' },
        targetType: 'boolean',
        targetValue: null,
        targetUnit: null,
        difficulty: 'medium',
        reminderTime: null,
        restDays: [],
        isArchived: false,
        createdAt: new Date(),
        sortOrder: 0,
      };

      await habitRepository.create(habit);
      const active = await habitRepository.getActive();
      expect(active).toHaveLength(1);
      expect(active[0].name).toBe('Lecture');

      await habitRepository.update('h-1', { name: 'Lecture du soir' });
      const updated = await habitRepository.getById('h-1');
      expect(updated?.name).toBe('Lecture du soir');

      await habitRepository.archive('h-1');
      expect(await habitRepository.getActive()).toHaveLength(0);
      expect(await habitRepository.getArchived()).toHaveLength(1);

      await habitRepository.restore('h-1');
      expect(await habitRepository.getActive()).toHaveLength(1);

      // Add completion then delete habit
      await completionRepository.save({
        id: 'c-1',
        habitId: 'h-1',
        date: '2026-10-14',
        value: 1,
        isRetroactive: false,
        completedAt: new Date(),
      });
      expect(await completionRepository.getByHabitId('h-1')).toHaveLength(1);

      await habitRepository.delete('h-1');
      expect(await habitRepository.getById('h-1')).toBeUndefined();
      expect(await completionRepository.getByHabitId('h-1')).toHaveLength(0);
    })();
  });

  it('CompletionRepository: saves completion and manages freeze days with compound index', () => {
    return (async () => {
      await completionRepository.save({
        id: 'c-1',
        habitId: 'h-2',
        date: '2026-10-14',
        value: 1,
        isRetroactive: false,
        completedAt: new Date(),
      });

      const found = await completionRepository.getByHabitAndDate('h-2', '2026-10-14');
      expect(found).toBeDefined();
      expect(found?.value).toBe(1);

      await completionRepository.addFreezeDay({
        id: 'f-1',
        habitId: 'h-2',
        date: '2026-10-15',
        createdAt: new Date(),
      });

      const freeze = await completionRepository.getFreezeDay('h-2', '2026-10-15');
      expect(freeze).toBeDefined();

      await completionRepository.removeFreezeDay('h-2', '2026-10-15');
      expect(await completionRepository.getFreezeDay('h-2', '2026-10-15')).toBeUndefined();
    })();
  });

  it('MoodRepository: saves and queries daily mood entries', () => {
    return (async () => {
      await moodRepository.save({
        id: 'm-1',
        date: '2026-10-14',
        level: 4,
        tags: ['focus', 'sport'],
        note: 'Superbe journée productive',
        createdAt: new Date(),
      });

      const entry = await moodRepository.getByDate('2026-10-14');
      expect(entry).toBeDefined();
      expect(entry?.level).toBe(4);
      expect(entry?.tags).toContain('sport');
    })();
  });

  it('BadgeRepository: unlocks badges idempotently and checks unlock state', () => {
    return (async () => {
      expect(await badgeRepository.isUnlocked('streak_7')).toBe(false);

      await badgeRepository.unlock('streak_7');
      expect(await badgeRepository.isUnlocked('streak_7')).toBe(true);

      // Unlocking again is idempotent
      await badgeRepository.unlock('streak_7');
      const all = await badgeRepository.getAll();
      expect(all.filter((b) => b.badgeId === 'streak_7')).toHaveLength(1);
    })();
  });
});
