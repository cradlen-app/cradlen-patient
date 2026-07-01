/**
 * Pure platform detection for the PWA install flow. All access to
 * `navigator`/`window`/`matchMedia` is guarded so these run safely during SSR
 * (where they return `false`) and are the single place UA/display-mode branching
 * lives.
 */

/** iOS Safari exposes a non-standard `navigator.standalone` flag. */
type IosNavigator = Navigator & { standalone?: boolean };

/**
 * Whether the current device is iOS/iPadOS Safari — the platform that has **no**
 * `beforeinstallprompt` API and needs the manual "Add to Home Screen" sheet.
 * iPadOS 13+ reports a desktop-Mac UA, so it's detected via touch points.
 */
export function isIOS(): boolean {
  if (typeof navigator === "undefined") return false;
  const ua = navigator.userAgent;
  const iPhoneClass = /iPad|iPhone|iPod/.test(ua);
  const iPadOSAsMac =
    ua.includes("Macintosh") && (navigator.maxTouchPoints ?? 0) > 1;
  return iPhoneClass || iPadOSAsMac;
}

/**
 * Whether the app is running as an installed/standalone PWA (either the
 * `display-mode: standalone` media query or the iOS `navigator.standalone`
 * flag). Used to suppress the install banner inside an already-installed app.
 */
export function isStandalone(): boolean {
  if (typeof window === "undefined") return false;
  const displayModeStandalone =
    typeof window.matchMedia === "function" &&
    window.matchMedia("(display-mode: standalone)").matches;
  const iosStandalone =
    typeof navigator !== "undefined" &&
    (navigator as IosNavigator).standalone === true;
  return Boolean(displayModeStandalone || iosStandalone);
}
