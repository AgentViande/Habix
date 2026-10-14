import { describe, it, expect } from 'vitest';
import {
  parseDate,
  formatDate,
  toUtcNoon,
  subtractDays,
  addDays,
  daysBetween,
  isBefore,
  isAfter,
  clampDate,
  getDayOfWeek,
  getWeekStart,
  getWeekEnd,
  getPreviousWeekStart,
  dateRange,
  isInRange,
  weekDayToNumber,
  getTodayLocal,
  getLocalTime,
} from './date-utils';

describe('date-utils primitives & arithmetic', () => {
  it('parses and formats YYYY-MM-DD correctly', () => {
    const parsed = parseDate('2026-10-14');
    expect(parsed).toEqual({ year: 2026, month: 10, day: 14 });
    expect(formatDate(2026, 10, 14)).toBe('2026-10-14');
  });

  it('parses ISO date strings without throwing', () => {
    const parsed = parseDate('2026-10-14T20:30:00.000Z');
    expect(parsed).toEqual({ year: 2026, month: 10, day: 14 });
  });

  it('throws on invalid calendar values in parseDate', () => {
    expect(() => parseDate('2026-13-10')).toThrow();
    expect(() => parseDate('2026-00-10')).toThrow();
    expect(() => parseDate('2026-10-35')).toThrow();
    expect(() => parseDate('not-a-date')).toThrow();
  });

  it('handles invalid timezone in getTodayLocal without throwing RangeError', () => {
    expect(() => getTodayLocal('Invalid/Nonexistent_Timezone')).not.toThrow();
    const result = getTodayLocal('Invalid/Nonexistent_Timezone');
    expect(result).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it('handles empty or undefined timezone in getTodayLocal', () => {
    expect(getTodayLocal('')).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(getTodayLocal(undefined)).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it('formats getLocalTime safely with timezone or fallback', () => {
    expect(getLocalTime('Europe/Paris')).toMatch(/^\d{2}:\d{2}$/);
    expect(getLocalTime('Invalid/Timezone')).toMatch(/^\d{2}:\d{2}$/);
    expect(getLocalTime()).toMatch(/^\d{2}:\d{2}$/);
  });

  it('converts to UTC noon cleanly', () => {
    const noon = toUtcNoon('2026-10-14');
    expect(noon.getUTCFullYear()).toBe(2026);
    expect(noon.getUTCMonth()).toBe(9); // 0-indexed October
    expect(noon.getUTCDate()).toBe(14);
    expect(noon.getUTCHours()).toBe(12);
  });

  it('adds and subtracts days without DST ambiguity', () => {
    expect(addDays('2026-10-14', 1)).toBe('2026-10-15');
    expect(addDays('2026-10-31', 1)).toBe('2026-11-01');
    expect(subtractDays('2026-11-01', 1)).toBe('2026-10-31');
    expect(subtractDays('2026-03-01', 1)).toBe('2026-02-28'); // non-leap year
  });

  it('calculates days between dates accurately', () => {
    expect(daysBetween('2026-10-01', '2026-10-14')).toBe(13);
    expect(daysBetween('2026-10-14', '2026-10-01')).toBe(-13);
    expect(daysBetween('2026-10-14', '2026-10-14')).toBe(0);
  });

  it('compares dates properly', () => {
    expect(isBefore('2026-10-01', '2026-10-14')).toBe(true);
    expect(isAfter('2026-10-15', '2026-10-14')).toBe(true);
    expect(clampDate('2026-09-01', '2026-10-01', '2026-10-31')).toBe('2026-10-01');
    expect(clampDate('2026-11-01', '2026-10-01', '2026-10-31')).toBe('2026-10-31');
  });

  it('determines the day of week accurately (UTC noon)', () => {
    // 2026-10-14 is a Wednesday (3)
    expect(getDayOfWeek('2026-10-14')).toBe(3);
    // 2026-10-18 is a Sunday (0)
    expect(getDayOfWeek('2026-10-18')).toBe(0);
    // 2026-10-19 is a Monday (1)
    expect(getDayOfWeek('2026-10-19')).toBe(1);
  });

  it('computes week start and week end with Monday start', () => {
    // 2026-10-14 (Wed) -> Week is 2026-10-12 (Mon) to 2026-10-18 (Sun)
    expect(getWeekStart('2026-10-14', 1)).toBe('2026-10-12');
    expect(getWeekEnd('2026-10-14', 1)).toBe('2026-10-18');
    expect(getPreviousWeekStart('2026-10-14', 1)).toBe('2026-10-05');
  });

  it('computes week start and week end with Sunday start', () => {
    // 2026-10-14 (Wed) -> Sunday start: 2026-10-11 (Sun) to 2026-10-17 (Sat)
    expect(getWeekStart('2026-10-14', 0)).toBe('2026-10-11');
    expect(getWeekEnd('2026-10-14', 0)).toBe('2026-10-17');
  });

  it('generates ranges and checks inclusion', () => {
    const range = dateRange('2026-10-10', '2026-10-13');
    expect(range).toEqual(['2026-10-10', '2026-10-11', '2026-10-12', '2026-10-13']);
    expect(isInRange('2026-10-12', '2026-10-10', '2026-10-13')).toBe(true);
    expect(isInRange('2026-10-14', '2026-10-10', '2026-10-13')).toBe(false);
  });

  it('converts weekday string to number', () => {
    expect(weekDayToNumber('sunday')).toBe(0);
    expect(weekDayToNumber('monday')).toBe(1);
  });
});
