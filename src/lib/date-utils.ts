/**
 * Pure date utilities for Habix.
 *
 * Design principles:
 * - All dates are stored/compared as "YYYY-MM-DD" local strings.
 * - No implicit timezone: every function that needs a timezone accepts it explicitly.
 * - No side effects — all functions are pure.
 * - No dependency on JS `Date` constructor with string argument
 *   (avoid "YYYY-MM-DD" being parsed as UTC midnight).
 */

// ---------------------------------------------------------------------------
// Core primitives
// ---------------------------------------------------------------------------

/**
 * Get today's date string in the given IANA timezone safely.
 * Uses 'fr-CA' locale which guarantees "YYYY-MM-DD" format.
 * Falls back safely if the timezone string is invalid or empty.
 */
export function getTodayLocal(timezone?: string): string {
  try {
    if (timezone && timezone.trim()) {
      return new Date().toLocaleDateString('fr-CA', { timeZone: timezone.trim() });
    }
  } catch {
    // Fallback to system timezone on invalid IANA string
  }

  try {
    return new Date().toLocaleDateString('fr-CA');
  } catch {
    const now = new Date();
    return formatDate(now.getFullYear(), now.getMonth() + 1, now.getDate());
  }
}

/**
 * Returns the current time as "HH:mm" in the given IANA timezone.
 */
export function getLocalTime(timezone?: string): string {
  try {
    if (timezone && timezone.trim()) {
      return new Date().toLocaleTimeString('fr-FR', {
        timeZone: timezone.trim(),
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
      });
    }
  } catch {
    // Fallback on invalid timezone
  }

  return new Date().toLocaleTimeString('fr-FR', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
}

/**
 * Parse a "YYYY-MM-DD" string (or ISO date string) into { year, month (1-12), day (1-31) }.
 * Does NOT use the Date constructor to avoid UTC interpretation shifts.
 */
export function parseDate(dateStr: string): { year: number; month: number; day: number } {
  if (!dateStr || typeof dateStr !== 'string') {
    throw new Error(`Invalid date string: "${dateStr}"`);
  }
  const match = dateStr.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
  if (!match) {
    throw new Error(`Invalid date string: "${dateStr}"`);
  }
  const year = parseInt(match[1], 10);
  const month = parseInt(match[2], 10);
  const day = parseInt(match[3], 10);

  if (month < 1 || month > 12 || day < 1 || day > 31) {
    throw new Error(`Invalid calendar date values: "${dateStr}"`);
  }

  return { year, month, day };
}

/**
 * Format a { year, month, day } object back to "YYYY-MM-DD".
 */
export function formatDate(year: number, month: number, day: number): string {
  return `${String(year).padStart(4, '0')}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

/**
 * Convert a "YYYY-MM-DD" string to a UTC-noon Date object.
 * UTC noon avoids DST ambiguity while still being unambiguously that calendar day.
 */
export function toUtcNoon(dateStr: string): Date {
  const { year, month, day } = parseDate(dateStr);
  return new Date(Date.UTC(year, month - 1, day, 12, 0, 0, 0));
}

// ---------------------------------------------------------------------------
// Arithmetic
// ---------------------------------------------------------------------------

/**
 * Subtract N days from a "YYYY-MM-DD" string. Returns a new "YYYY-MM-DD" string.
 * Uses UTC noon to avoid DST issues.
 */
export function subtractDays(dateStr: string, n: number): string {
  const d = toUtcNoon(dateStr);
  d.setUTCDate(d.getUTCDate() - n);
  return formatDate(d.getUTCFullYear(), d.getUTCMonth() + 1, d.getUTCDate());
}

/**
 * Add N days to a "YYYY-MM-DD" string.
 */
export function addDays(dateStr: string, n: number): string {
  return subtractDays(dateStr, -n);
}

/**
 * Number of full days between two "YYYY-MM-DD" strings.
 * Positive if b > a, negative if b < a.
 */
export function daysBetween(a: string, b: string): number {
  const msA = toUtcNoon(a).getTime();
  const msB = toUtcNoon(b).getTime();
  return Math.round((msB - msA) / (1000 * 60 * 60 * 24));
}

/**
 * Returns true if dateStr a is strictly before b.
 */
export function isBefore(a: string, b: string): boolean {
  return a < b;
}

/**
 * Returns true if dateStr a is strictly after b.
 */
export function isAfter(a: string, b: string): boolean {
  return a > b;
}

/**
 * Clamp dateStr between min and max (inclusive).
 */
export function clampDate(dateStr: string, min: string, max: string): string {
  if (dateStr < min) return min;
  if (dateStr > max) return max;
  return dateStr;
}

// ---------------------------------------------------------------------------
// Day-of-week
// ---------------------------------------------------------------------------

/**
 * Returns the day of week (0=Sunday, 1=Monday … 6=Saturday) for a "YYYY-MM-DD".
 * Uses UTC to avoid timezone shifts.
 */
export function getDayOfWeek(dateStr: string): number {
  return toUtcNoon(dateStr).getUTCDay();
}

// ---------------------------------------------------------------------------
// Week boundaries
// ---------------------------------------------------------------------------

/**
 * weekStartsOn: 0=Sunday, 1=Monday (matches date-fns convention).
 */
export type WeekStartsOn = 0 | 1;

/**
 * Returns the "YYYY-MM-DD" of the first day of the ISO week containing dateStr.
 * weekStartsOn: 1 = Monday (default), 0 = Sunday.
 */
export function getWeekStart(dateStr: string, weekStartsOn: WeekStartsOn = 1): string {
  const dow = getDayOfWeek(dateStr); // 0=Sun … 6=Sat
  const diff = (dow - weekStartsOn + 7) % 7;
  return subtractDays(dateStr, diff);
}

/**
 * Returns the "YYYY-MM-DD" of the last day of the week containing dateStr.
 */
export function getWeekEnd(dateStr: string, weekStartsOn: WeekStartsOn = 1): string {
  return addDays(getWeekStart(dateStr, weekStartsOn), 6);
}

/**
 * Returns the week-start string for the previous week relative to dateStr.
 */
export function getPreviousWeekStart(dateStr: string, weekStartsOn: WeekStartsOn = 1): string {
  return subtractDays(getWeekStart(dateStr, weekStartsOn), 7);
}

// ---------------------------------------------------------------------------
// Range helpers
// ---------------------------------------------------------------------------

/**
 * Returns all "YYYY-MM-DD" strings from start to end (inclusive), ascending.
 */
export function dateRange(start: string, end: string): string[] {
  const result: string[] = [];
  let current = start;
  while (current <= end) {
    result.push(current);
    current = addDays(current, 1);
  }
  return result;
}

/**
 * Returns true if dateStr is within [start, end] (inclusive).
 */
export function isInRange(dateStr: string, start: string, end: string): boolean {
  return dateStr >= start && dateStr <= end;
}

// ---------------------------------------------------------------------------
// weekStartDay string → WeekStartsOn number
// ---------------------------------------------------------------------------

export function weekDayToNumber(weekDay: string): WeekStartsOn {
  return weekDay === 'sunday' ? 0 : 1;
}
