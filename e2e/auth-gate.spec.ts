import { test, expect } from "@playwright/test";

/**
 * The optimistic proxy gate (`src/proxy.ts`) redirects unauthenticated visits to
 * any `/patient/*` route to the localized sign-in. Backend-independent.
 */
test.describe("proxy auth gate", () => {
  test("redirects an unauthenticated /en/patient visit to /en/patient/signin", async ({
    page,
  }) => {
    await page.goto("/en/patient");
    await expect(page).toHaveURL(/\/en\/patient\/signin/);
  });

  test("redirects an unauthenticated /ar/patient visit to /ar/patient/signin", async ({
    page,
  }) => {
    await page.goto("/ar/patient");
    await expect(page).toHaveURL(/\/ar\/patient\/signin/);
  });

  test("redirects a protected sub-route (medications) to sign-in", async ({ page }) => {
    await page.goto("/en/patient/medications");
    await expect(page).toHaveURL(/\/en\/patient\/signin/);
  });
});

test.describe("public auth pages are reachable without a session", () => {
  for (const path of ["signin", "signup", "forgot-password"]) {
    test(`/en/patient/${path} loads without redirecting`, async ({ page }) => {
      const response = await page.goto(`/en/patient/${path}`);
      expect(response?.status()).toBeLessThan(400);
      await expect(page).toHaveURL(new RegExp(`/en/patient/${path}`));
    });
  }
});
