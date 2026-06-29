import { defineConfig, devices } from "@playwright/test";

/**
 * E2E config for the patient portal. Boots the Next.js dev server on port 3200
 * (the project's configured dev port) and drives it with Chromium. The default
 * specs are backend-independent — they exercise the proxy auth gate, public
 * routing, RTL/LTR, and client-side validation — so they stay deterministic
 * without `cradlen-api` running.
 */
export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? "github" : "list",
  // The Next dev server compiles each route on first hit; under many parallel
  // workers on a slow filesystem those cold compiles contend and can exceed the
  // default timeout. Cap workers and give actions/navigation generous windows.
  workers: process.env.CI ? 2 : 2,
  timeout: 90_000,
  expect: { timeout: 15_000 },
  use: {
    baseURL: "http://localhost:3200",
    trace: "on-first-retry",
    actionTimeout: 30_000,
    navigationTimeout: 60_000,
  },
  projects: [
    { name: "chromium", use: { ...devices["Desktop Chrome"] } },
    { name: "mobile", use: { ...devices["Pixel 7"] } },
  ],
  webServer: {
    command: "npm run dev",
    url: "http://localhost:3200",
    reuseExistingServer: !process.env.CI,
    timeout: 180_000,
  },
});
