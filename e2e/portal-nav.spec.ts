import { test, expect, type Page } from "@playwright/test";

/**
 * Authenticated portal flows. We seed the HttpOnly refresh cookie directly so the
 * optimistic proxy gate (`src/proxy.ts`) lets `/patient/*` through, then stub the
 * same-origin data handlers so the screens render deterministically without a
 * running `cradlen-api`.
 */

async function stubAuthedApi(page: Page) {
  await page.route("**/api/patient-auth/me", (route) =>
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        data: {
          patient_id: "p1",
          accessible_patient_ids: ["p1"],
          full_name: "Test Patient",
          profiles: [{ id: "p1", kind: "self", full_name: "Test Patient" }],
        },
        meta: {},
      }),
    }),
  );
  await page.route("**/api/patient-portal/**", (route) =>
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        data: [],
        meta: { page: 1, limit: 10, total: 0, totalPages: 0 },
      }),
    }),
  );
}

test.beforeEach(async ({ context }) => {
  await context.addCookies([
    {
      name: "cradlen-patient-refresh-token",
      value: "mock-refresh",
      url: "http://localhost:3200",
      httpOnly: true,
      sameSite: "Lax",
    },
  ]);
});

test.describe("authenticated portal screens render with a session", () => {
  for (const { path, heading } of [
    { path: "visits", heading: "Visits" },
    { path: "tests", heading: "Tests" },
    { path: "medications", heading: "Prescriptions" },
    { path: "record", heading: "Health record" },
  ]) {
    test(`/en/patient/${path} renders its screen header`, async ({ page }) => {
      await stubAuthedApi(page);
      await page.goto(`/en/patient/${path}`);
      await expect(page).toHaveURL(new RegExp(`/en/patient/${path}`));
      await expect(
        page.getByRole("heading", { level: 1, name: heading }),
      ).toBeVisible();
    });
  }
});

test.describe("authenticated portal navigation", () => {
  test("navigates between screens via the sidebar (desktop)", async ({ page, isMobile }) => {
    test.skip(!!isMobile, "sidebar is desktop-only; mobile uses bottom tabs");
    await stubAuthedApi(page);

    await page.goto("/en/patient/visits");
    await expect(page.getByRole("heading", { level: 1, name: "Visits" })).toBeVisible();

    await page.getByRole("link", { name: "Tests" }).click();
    await expect(page).toHaveURL(/\/en\/patient\/tests/);
    await expect(page.getByRole("heading", { level: 1, name: "Tests" })).toBeVisible();
  });

  test("renders the portal RTL under the ar locale", async ({ page }) => {
    await stubAuthedApi(page);
    await page.goto("/ar/patient/visits");
    await expect(page.locator("html")).toHaveAttribute("dir", "rtl");
  });
});
