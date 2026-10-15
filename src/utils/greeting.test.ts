import { describe, it, expect } from 'vitest';
import {
  getTimeOfDayGreeting,
  getAllDoneMessage,
  getStreakDangerToast,
  getWeeklyReviewGreeting,
} from './greeting';

describe('Greeting and Personalization (greeting.ts)', () => {
  it('returns morning greeting for hours between 5 and 12', () => {
    const morningDate = new Date(2026, 9, 15, 8, 30);
    expect(getTimeOfDayGreeting('Alex', morningDate)).toBe('Bonjour Alex');
    expect(getTimeOfDayGreeting('', morningDate)).toBe('Bonjour');
    expect(getTimeOfDayGreeting(undefined, morningDate)).toBe('Bonjour');
  });

  it('returns afternoon greeting for hours between 12 and 18', () => {
    const afternoonDate = new Date(2026, 9, 15, 14, 0);
    expect(getTimeOfDayGreeting('Sarah', afternoonDate)).toBe('Bon après-midi Sarah');
    expect(getTimeOfDayGreeting('', afternoonDate)).toBe('Bon après-midi');
  });

  it('returns evening greeting for hours 18 and later or before 5', () => {
    const eveningDate = new Date(2026, 9, 15, 20, 30);
    expect(getTimeOfDayGreeting('Lilian', eveningDate)).toBe('Bonsoir Lilian');
    expect(getTimeOfDayGreeting(undefined, eveningDate)).toBe('Bonsoir');

    const nightDate = new Date(2026, 9, 15, 2, 0);
    expect(getTimeOfDayGreeting('Lilian', nightDate)).toBe('Bonsoir Lilian');
  });

  it('handles getAllDoneMessage gracefully with or without userName', () => {
    expect(getAllDoneMessage('Alex')).toBe('Félicitations Alex ! Journée parfaite ! 🎉 (+50 XP)');
    expect(getAllDoneMessage('')).toBe('Félicitations ! Journée parfaite ! 🎉 (+50 XP)');
    expect(getAllDoneMessage(undefined)).toBe('Félicitations ! Journée parfaite ! 🎉 (+50 XP)');
  });

  it('handles getStreakDangerToast gracefully with or without userName', () => {
    expect(getStreakDangerToast(7, 'Alex')).toBe('Alex, ta série de 7 jours est en danger !');
    expect(getStreakDangerToast(7, '')).toBe('Ta série de 7 jours est en danger !');
    expect(getStreakDangerToast(7, undefined)).toBe('Ta série de 7 jours est en danger !');
  });

  it('handles getWeeklyReviewGreeting properly', () => {
    expect(getWeeklyReviewGreeting('Sarah')).toBe('Bilan hebdomadaire de Sarah');
    expect(getWeeklyReviewGreeting('')).toBe('Votre bilan hebdomadaire');
  });

  it('never outputs the string undefined or excess spaces', () => {
    const res = getTimeOfDayGreeting(undefined);
    expect(res).not.toContain('undefined');
    expect(res).not.toContain('  ');
  });
});
