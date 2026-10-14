import { describe, it, expect } from 'vitest';
import { validateAndSanitizeBackup } from './import-export';

describe('JSON Import Validation & Security (import-export.ts)', () => {
  it('throws an error if input is not an object or lacks habits array', () => {
    expect(() => validateAndSanitizeBackup(null)).toThrow('Le fichier sélectionné');
    expect(() => validateAndSanitizeBackup('string')).toThrow('Le fichier sélectionné');
    expect(() => validateAndSanitizeBackup({})).toThrow('doit contenir une liste "habits"');
    expect(() => validateAndSanitizeBackup({ habits: 'not-an-array' })).toThrow();
  });

  it('throws on habit missing mandatory id or name', () => {
    expect(() =>
      validateAndSanitizeBackup({
        habits: [{ id: '', name: 'Test' }],
      })
    ).toThrow();

    expect(() =>
      validateAndSanitizeBackup({
        habits: [{ id: 'h-1', name: '   ' }],
      })
    ).toThrow();
  });

  it('sanitizes and rehydrates valid habits and related data', () => {
    const raw = {
      habits: [
        {
          id: 'habit-1',
          name: '   Méditation quotidienne   ',
          frequencyType: 'daily',
          createdAt: '2026-10-01T12:00:00.000Z',
          updatedAt: '2026-10-14T08:00:00.000Z',
        },
      ],
      completions: [
        {
          id: 'c-1',
          habitId: 'habit-1',
          date: '2026-10-14',
          value: 1,
          completedAt: '2026-10-14T08:30:00.000Z',
        },
        // Orphan completion pointing to nonexistent habit: should be filtered out
        {
          id: 'c-orphan',
          habitId: 'habit-nonexistent',
          date: '2026-10-14',
          value: 1,
        },
      ],
      freezeDays: [
        {
          id: 'f-1',
          habitId: 'habit-1',
          date: '2026-10-13',
          createdAt: '2026-10-13T10:00:00.000Z',
        },
      ],
      moods: [
        {
          id: 'm-1',
          date: '2026-10-14',
          level: 5,
          note: 'Super forme !',
        },
      ],
      userProfile: [
        {
          id: 'u-1',
          displayName: 'Aventurier Test',
          totalXP: 500,
          currentLevel: 3,
          availableFreezeDays: 2,
        },
      ],
    };

    const sanitized = validateAndSanitizeBackup(raw);

    // Habits
    expect(sanitized.habits.length).toBe(1);
    expect(sanitized.habits[0].name).toBe('Méditation quotidienne');
    expect(sanitized.habits[0].createdAt).toBeInstanceOf(Date);

    // Completions: orphan removed
    expect(sanitized.completions.length).toBe(1);
    expect(sanitized.completions[0].habitId).toBe('habit-1');
    expect(sanitized.completions[0].completedAt).toBeInstanceOf(Date);

    // FreezeDays
    expect(sanitized.freezeDays.length).toBe(1);
    expect(sanitized.freezeDays[0].createdAt).toBeInstanceOf(Date);

    // Moods
    expect(sanitized.moods.length).toBe(1);
    expect(sanitized.moods[0].level).toBe(5);

    // User Profile
    expect(sanitized.userProfile?.[0].totalXP).toBe(500);
    expect(sanitized.userProfile?.[0].currentLevel).toBe(3);
  });

  it('rejects invalid date formats in completions and moods', () => {
    const raw = {
      habits: [{ id: 'h-1', name: 'Habit' }],
      completions: [
        { id: 'c-1', habitId: 'h-1', date: 'invalid-date', value: 1 },
        { id: 'c-2', habitId: 'h-1', date: '2026-10-14', value: 1 },
      ],
      moods: [
        { id: 'm-1', date: '14-10-2026', level: 3 }, // invalid format (not YYYY-MM-DD)
        { id: 'm-2', date: '2026-10-14', level: 4 },
      ],
    };

    const sanitized = validateAndSanitizeBackup(raw);
    expect(sanitized.completions.length).toBe(1);
    expect(sanitized.completions[0].date).toBe('2026-10-14');
    expect(sanitized.moods.length).toBe(1);
    expect(sanitized.moods[0].date).toBe('2026-10-14');
  });
});
