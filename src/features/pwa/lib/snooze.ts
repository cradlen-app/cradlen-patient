/**
 * Pure eligibility logic for the custom install banner. Kept DOM-free so the
 * branchable "should we even offer install right now?" decision is unit-tested
 * in isolation from browser event wiring.
 */

/** How long a "Not now" dismissal suppresses the install banner: 14 days. */
export const SNOOZE_MS = 14 * 24 * 60 * 60 * 1000;

export type CanShowInstallArgs = {
  /** `true` once the app has been installed (the `appinstalled` event fired). */
  installed: boolean;
  /** Epoch ms of the last "Not now", or `null` if never dismissed. */
  dismissedAt: number | null;
  /** Current time in epoch ms. */
  now: number;
};

/**
 * Whether the install banner is eligible to show, ignoring platform concerns
 * (standalone / prompt availability are layered on in the hook). An installed
 * app never nags; a never-dismissed user always qualifies; a dismissal holds
 * for {@link SNOOZE_MS} before we offer once more.
 */
export function canShowInstall({
  installed,
  dismissedAt,
  now,
}: CanShowInstallArgs): boolean {
  if (installed) return false;
  if (dismissedAt == null) return true;
  return now - dismissedAt > SNOOZE_MS;
}
