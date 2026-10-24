/**
 * Mobile Haptic Feedback Provider
 * Directly utilizes navigator.vibrate() to deliver tactile arcade feedback on mobile devices.
 * Supports distinct tactile signatures for collisions/impacts, near-misses, milestones, and thrust pulses.
 */

export const HAPTIC_PATTERNS = {
  // Light haptic tick for discrete tap-pulse hops
  tap: 10,
  // Rapid double-pulse for near-miss close shaves
  nearMiss: [18, 30, 22],
  // Ascending celebratory rhythmic pattern for 1,000 km milestones
  milestone: [25, 35, 30, 35, 45, 35, 60],
  // Heavy multi-shock vibration for hull collision / re-entry burnup
  crash: [70, 40, 100, 50, 150],
};

export function triggerHaptic(type: keyof typeof HAPTIC_PATTERNS): boolean {
  if (typeof window === 'undefined' || typeof navigator === 'undefined') return false;
  if (!('vibrate' in navigator) || typeof navigator.vibrate !== 'function') return false;

  try {
    return navigator.vibrate(HAPTIC_PATTERNS[type]);
  } catch {
    return false;
  }
}

/**
 * Stop any ongoing vibration patterns
 */
export function cancelHaptic(): void {
  if (typeof window === 'undefined' || typeof navigator === 'undefined') return;
  if ('vibrate' in navigator && typeof navigator.vibrate === 'function') {
    try {
      navigator.vibrate(0);
    } catch {}
  }
}
