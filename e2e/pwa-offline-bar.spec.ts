import { test, expect } from "@playwright/test";

/**
 * PWA Phase 2 — offline status bar.
 *
 * Unlike the offline *fallback page* (which is only precached by `next build`
 * and self-skips on the dev server), the offline *bar* is driven purely by the
 * browser `online`/`offline` events, so it works against the dev server.
 *
 * Known gap: the custom install banner depends on `beforeinstallprompt`, which
 * cannot be reliably synthesized in Playwright/Chromium. Its behavior is covered
 * by unit/component tests (`src/features/pwa/**`), not e2e — documented here
 * rather than silently skipped.
 */

test("shows an offline bar while offline and clears it on reconnect", async ({
  page,
  context,
}) => {
  await page.goto("/en/patient/signin");
  await expect(page.getByRole("button", { name: /sign in/i }).first()).toBeVisible();

  // Go offline: the status bar should appear (no navigation required).
  await context.setOffline(true);
  const bar = page.getByRole("status");
  await expect(bar).toHaveText(/offline/i);

  // Reconnect: a brief "back online" confirmation, then the bar goes away.
  await context.setOffline(false);
  await expect(bar).toHaveText(/back online/i);
  await expect(page.getByRole("status")).toHaveCount(0, { timeout: 5000 });
});
