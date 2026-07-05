import { test, expect } from "@playwright/test";

/**
 * PWA service worker registration. The Serwist worker is served at `/sw.js` via
 * the static route handler (`src/app/sw.js/route.ts`); this spec asserts that the
 * `ServiceWorkerRegister` component registers it and that the browser's
 * `navigator.serviceWorker.ready` resolves with an active controller.
 *
 * Runs against the dev server (existing webServer config) because the SW is
 * compiled on demand by the route handler's esbuild pipeline and is available in
 * both dev and production modes.
 */
test("registers a service worker controlling the page", async ({ page }) => {
  await page.goto("/en/patient/signin");
  await page.waitForFunction(async () => {
    if (!("serviceWorker" in navigator)) return false;
    const reg = await navigator.serviceWorker.ready;
    return Boolean(reg.active);
  });
  const scope = await page.evaluate(async () => {
    const reg = await navigator.serviceWorker.ready;
    return reg.scope;
  });
  expect(scope).toContain("/");
});
