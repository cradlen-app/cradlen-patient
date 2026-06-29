import { test, expect } from "@playwright/test";

/** Sign-in page: localization direction + client-side validation (no backend). */
test.describe("patient sign-in", () => {
  test("renders LTR for English and RTL for Arabic", async ({ page }) => {
    await page.goto("/en/patient/signin");
    await expect(page.locator("html")).toHaveAttribute("dir", "ltr");
    await expect(page.locator("html")).toHaveAttribute("lang", "en");

    await page.goto("/ar/patient/signin");
    await expect(page.locator("html")).toHaveAttribute("dir", "rtl");
    await expect(page.locator("html")).toHaveAttribute("lang", "ar");
  });

  test("shows a validation error when submitting an empty form", async ({ page }) => {
    await page.goto("/en/patient/signin");
    await page.getByRole("button", { name: "Sign in" }).click();
    await expect(page.getByText("National ID is required")).toBeVisible();
  });

  test("validates the national id format before calling the backend", async ({ page }) => {
    let backendCalled = false;
    await page.route("**/api/patient-auth/login", (route) => {
      backendCalled = true;
      return route.fulfill({ status: 200, body: "{}" });
    });

    await page.goto("/en/patient/signin");
    await page.getByLabel("National ID").fill("123"); // too short
    await page.getByLabel("Password").fill("Abcdef1!");
    await page.getByRole("button", { name: "Sign in" }).click();

    await expect(page.getByText(/valid 14-digit National ID/i)).toBeVisible();
    expect(backendCalled).toBe(false);
  });

  test("redirects to the portal when the login endpoint succeeds (mocked)", async ({
    page,
  }) => {
    // Intercept the same-origin login handler and emit the HttpOnly session
    // cookie the real handler would set, so the proxy gate lets /patient through.
    await page.route("**/api/patient-auth/login", (route) =>
      route.fulfill({
        status: 200,
        headers: {
          "content-type": "application/json",
          "set-cookie":
            "cradlen-patient-refresh-token=mock-refresh; Path=/; HttpOnly; SameSite=Lax",
        },
        body: JSON.stringify({ data: { authenticated: true }, meta: {} }),
      }),
    );

    await page.goto("/en/patient/signin");
    await page.getByLabel("National ID").fill("12345678901234");
    await page.getByLabel("Password").fill("Abcdef1!");
    await page.getByRole("button", { name: "Sign in" }).click();

    // Navigated away from sign-in (the proxy gate accepted the refresh cookie).
    await expect(page).not.toHaveURL(/\/signin/, { timeout: 15_000 });
  });
});
