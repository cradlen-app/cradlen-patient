import { test, expect } from "@playwright/test";

/**
 * Optional real-backend sign-in smoke. Skipped by default — it talks to a live
 * `cradlen-api`, so it only runs when explicitly opted in:
 *
 *   E2E_REAL_BACKEND=1 \
 *   E2E_PATIENT_NATIONAL_ID=<14-digit id> \
 *   E2E_PATIENT_PASSWORD=<password> \
 *   API_BASE_URL=<staging backend>   # point the dev server at a safe backend
 *   npm run e2e -- e2e/real-backend.smoke.spec.ts
 *
 * Use a disposable staging account, never production credentials.
 */
const NID = process.env.E2E_PATIENT_NATIONAL_ID;
const PWD = process.env.E2E_PATIENT_PASSWORD;
const ENABLED = process.env.E2E_REAL_BACKEND === "1" && !!NID && !!PWD;

const describe = ENABLED ? test.describe : test.describe.skip;

describe("real-backend sign-in smoke", () => {
  test("signs in with real credentials and reaches the portal", async ({ page }) => {
    await page.goto("/en/patient/signin");
    await page.getByLabel("National ID").fill(NID!);
    await page.getByLabel("Password").fill(PWD!);
    await page.getByRole("button", { name: "Sign in" }).click();

    // The route handler sets the session cookies and the form redirects to the
    // portal; landing anywhere under /patient (not /signin) is the smoke signal.
    await expect(page).toHaveURL(/\/en\/patient(\/|$)/, { timeout: 30_000 });
    await expect(page).not.toHaveURL(/\/signin/);
  });
});
