/**
 * Presence is derived from a heartbeat: the web app pings /users/heartbeat
 * periodically while open, refreshing lastSeenAt. A user counts as "online" if
 * their last heartbeat is within ONLINE_WINDOW_MS. This also drives the
 * "email only when offline" rule for new-message notifications.
 */
export const ONLINE_WINDOW_MS = 60 * 1000; // 1 minute

/**
 * Détermine si un habitant est considéré comme connecté à partir de son dernier heartbeat.
 * @param lastSeenAt Date du dernier signal de présence (absente ⇒ hors ligne)
 * @returns true si le dernier heartbeat date de moins de ONLINE_WINDOW_MS (1 minute)
 */
export function isOnline(lastSeenAt?: Date | null): boolean {
  if (!lastSeenAt) return false;
  return Date.now() - new Date(lastSeenAt).getTime() < ONLINE_WINDOW_MS;
}
