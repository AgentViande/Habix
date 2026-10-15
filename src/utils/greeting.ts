/**
 * greeting.ts — Personalized greetings and contextual messages for Habix.
 * Handles graceful fallbacks when the user's name is not specified (no "undefined" or weird spaces).
 */

export function getTimeOfDayGreeting(userName?: string, date: Date = new Date()): string {
  const hour = date.getHours();
  const trimmed = userName?.trim();

  let salutation = 'Bonjour';
  if (hour >= 12 && hour < 18) {
    salutation = 'Bon après-midi';
  } else if (hour >= 18 || hour < 5) {
    salutation = 'Bonsoir';
  }

  return trimmed ? `${salutation} ${trimmed}` : salutation;
}

export function getAllDoneMessage(userName?: string): string {
  const trimmed = userName?.trim();
  return trimmed
    ? `Félicitations ${trimmed} ! Journée parfaite ! 🎉 (+50 XP)`
    : 'Félicitations ! Journée parfaite ! 🎉 (+50 XP)';
}

export function getStreakDangerToast(streakDays: number, userName?: string): string {
  const trimmed = userName?.trim();
  return trimmed
    ? `${trimmed}, ta série de ${streakDays} jours est en danger !`
    : `Ta série de ${streakDays} jours est en danger !`;
}

export function getWeeklyReviewGreeting(userName?: string): string {
  const trimmed = userName?.trim();
  return trimmed ? `Bilan hebdomadaire de ${trimmed}` : 'Votre bilan hebdomadaire';
}
