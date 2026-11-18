// Thin wrapper around the browser Notification API. Every function is safe to
// call anywhere: if notifications are unsupported or blocked, nothing happens.

function supported(): boolean {
  return typeof window !== 'undefined' && 'Notification' in window;
}

/** Ask for permission, but only if the user hasn't answered before. */
export function requestNotificationPermission(): void {
  if (supported() && Notification.permission === 'default') {
    void Notification.requestPermission();
  }
}

export function showNotification(title: string, body: string): void {
  if (!supported() || Notification.permission !== 'granted') return;
  try {
    // `tag` makes a new notification replace the previous one instead of stacking.
    new Notification(title, { body, tag: 'hearth-phase' });
  } catch {
    // Some mobile browsers only allow notifications from a service worker
    // (comes with the PWA work in Phase 6).
  }
}
