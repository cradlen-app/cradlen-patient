/**
 * The backend sends a **bare portal path** in a push payload's `navigate_to`
 * (e.g. `/tests`), exactly as the in-app notification feed receives it. The feed
 * resolves it with `patientHref` (`/patient{path}`) + the locale-aware next-intl
 * router. The service worker has no next-intl runtime, so it must apply the same
 * transform itself to land the click on a real, locale-prefixed route
 * (`/<locale>/patient/<path>`).
 *
 * Locales are kept local (mirroring `src/i18n/routing.ts`) rather than imported,
 * to avoid pulling next-intl into the service-worker bundle.
 */
const LOCALES = ["en", "ar"] as const;
const DEFAULT_LOCALE = "en";

function normalizeLocale(locale: string | null | undefined): string {
  return (LOCALES as readonly string[]).includes(locale ?? "")
    ? (locale as string)
    : DEFAULT_LOCALE;
}

/**
 * Resolve a push `navigate_to` (a bare portal path, or `null`/`"/"`) into the
 * real app route, mirroring `patientHref` and next-intl's always-on locale
 * prefix. Empty/`"/"`/absent → the portal home.
 */
export function resolvePatientDeepLink(
  navigateTo: string | null | undefined,
  locale: string | null | undefined,
): string {
  const loc = normalizeLocale(locale);
  const path = !navigateTo || navigateTo === "/" ? "" : navigateTo;
  const patientPath = path === "" ? "/patient" : `/patient${path}`;
  return `/${loc}${patientPath}`;
}

/**
 * Pick a locale from the open window clients' URLs — the first path segment that
 * is a known locale — so a push click lands in the locale the user is actually
 * using. Falls back to the default locale when no client reveals one.
 */
export function localeFromClientUrls(urls: string[]): string {
  for (const url of urls) {
    try {
      const seg = new URL(url).pathname.split("/")[1];
      if ((LOCALES as readonly string[]).includes(seg)) return seg;
    } catch {
      // ignore malformed client URLs
    }
  }
  return DEFAULT_LOCALE;
}
