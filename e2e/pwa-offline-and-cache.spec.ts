import { test, expect } from "@playwright/test";

/**
 * PWA offline & PHI-cache verification.
 *
 * Proves the two central security/UX properties:
 *   1. No authenticated patient-API response ever sits in Cache Storage
 *      (the SW's NetworkOnly guard fires before any generic cache handler).
 *   2. Offline navigation falls back to the /~offline page instead of the
 *      browser's own "no internet" error screen.
 *
 * Runs against the dev server (same webServer config as other e2e specs) because
 * the SW is compiled on demand by the route handler's esbuild pipeline and is
 * available in both dev and production modes.
 *
 * Note: the offline-page heading uses &rsquo; (U+2019 RIGHT SINGLE QUOTATION MARK),
 * so we assert on a heading role matching /offline/i rather than the exact string.
 */
test(
  "serves the offline page and never caches patient API responses",
  async ({ page, context }) => {
    // Land on a page the SW will claim.
    await page.goto("/en/patient/signin");

    // Wait until the service worker is active AND controlling this page.
    // `serviceWorker.ready` resolves when there is an active worker, but
    // `clientsClaim()` (called during the activate event) propagates to the
    // current client slightly after. We must wait for `controller` to be
    // non-null; otherwise the fetch event won't fire for offline navigations.
    await page.waitForFunction(async () => {
      if (!("serviceWorker" in navigator)) return false;
      const reg = await navigator.serviceWorker.ready;
      return Boolean(reg.active) && Boolean(navigator.serviceWorker.controller);
    });

    // ── PHI-cache assertion ──────────────────────────────────────────────────
    // No authenticated patient-API response may sit in any Cache Storage bucket.
    const cachedApi = await page.evaluate(async () => {
      const names = await caches.keys();
      for (const name of names) {
        const cache = await caches.open(name);
        const reqs = await cache.keys();
        if (
          reqs.some((r) =>
            /\/api\/(patient-portal|patient-auth)\//.test(
              new URL(r.url).pathname,
            ),
          )
        ) {
          return true;
        }
      }
      return false;
    });
    expect(cachedApi).toBe(false);

    // ── Offline fallback assertion ────────────────────────────────────────────
    // When offline, document navigations must resolve to the /~offline page, not
    // the browser's built-in network-error screen.
    await context.setOffline(true);
    await page.goto("/en/patient/visits").catch(() => {});
    await expect(
      page.getByRole("heading", { name: /offline/i }).first(),
    ).toBeVisible();
    await context.setOffline(false);
  },
);
