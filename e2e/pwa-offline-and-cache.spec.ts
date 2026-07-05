import { test, expect, type Page } from "@playwright/test";

/**
 * PWA security & offline verification.
 *
 * Test 1 (runs in every environment): proves no authenticated patient-API
 * response is ever stored in Cache Storage — even after a real GET is issued —
 * because the SW's NetworkOnly guard fires before any generic cache handler.
 *
 * Test 2 (production builds only): proves offline document navigation falls back
 * to the /~offline page. That fallback is only precached by `next build`, so the
 * test self-skips on the dev server (which never precaches it). Run it against a
 * production server (`next build` + `next start`) to exercise it.
 */

async function waitForActiveController(page: Page) {
  await page.waitForFunction(async () => {
    if (!("serviceWorker" in navigator)) return false;
    const reg = await navigator.serviceWorker.ready;
    return Boolean(reg.active) && Boolean(navigator.serviceWorker.controller);
  });
}

test("never caches patient API responses", async ({ page }) => {
  await page.goto("/en/patient/signin");
  await waitForActiveController(page);

  // Issue a real same-origin patient-API GET. If the NetworkOnly guard were
  // broken, defaultCache's "/api/" NetworkFirst handler would store this
  // response in the "apis" cache — which is exactly what we forbid.
  await page.evaluate(async () => {
    try {
      await fetch("/api/patient-auth/me", { credentials: "include" });
    } catch {
      /* network/auth status irrelevant; we only assert it is not cached */
    }
  });
  await page.waitForTimeout(500); // let the SW finish any (forbidden) cache write

  const cachedApi = await page.evaluate(async () => {
    for (const name of await caches.keys()) {
      const cache = await caches.open(name);
      const reqs = await cache.keys();
      if (
        reqs.some((r) =>
          /\/api\/(patient-portal|patient-auth)(\/|$)/.test(
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
});

test("offline navigation falls back to the offline page", async ({ page, context }) => {
  await page.goto("/en/patient/signin");
  await waitForActiveController(page);

  const offlinePrecached = await page.evaluate(async () => {
    for (const name of await caches.keys()) {
      const cache = await caches.open(name);
      const reqs = await cache.keys();
      if (reqs.some((r) => new URL(r.url).pathname === "/~offline")) return true;
    }
    return false;
  });
  test.skip(
    !offlinePrecached,
    "offline fallback is only precached by `next build`; skipped on the dev server",
  );

  await context.setOffline(true);
  await page.goto("/en/patient/visits").catch(() => {});
  await expect(page.getByRole("heading", { name: /offline/i }).first()).toBeVisible();
  await context.setOffline(false);
});
