/**
 * notifications.ts — Browser notifications service for Habix.
 *
 * Implements SPEC.md §11:
 * - Request permissions
 * - Dispatch local notifications for reminders
 */

export async function requestNotificationPermission(): Promise<boolean> {
  if (!('Notification' in window)) {
    return false;
  }

  if (Notification.permission === 'granted') {
    return true;
  }

  if (Notification.permission !== 'denied') {
    const permission = await Notification.requestPermission();
    return permission === 'granted';
  }

  return false;
}

export function sendLocalNotification(
  title: string,
  body: string,
  icon = './icons/icon-192.png'
): boolean {
  if (!('Notification' in window) || Notification.permission !== 'granted') {
    return false;
  }

  try {
    new Notification(title, {
      body,
      icon,
      badge: icon,
    });
    return true;
  } catch (err) {
    console.error('Notification dispatch error:', err);
    return false;
  }
}
