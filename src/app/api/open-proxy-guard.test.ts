import { existsSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

/**
 * Regression guard for the removed open backend proxy. The catch-all
 * `/api/patient-backend/[...path]` route forwarded ANY path + every HTTP method
 * to the backend with the patient token attached — an authenticated patient
 * could reach arbitrary (incl. staff/admin) backend endpoints. It was deleted;
 * this test fails loudly if it is ever reintroduced.
 */
describe("no open backend proxy", () => {
  it("the catch-all /api/patient-backend route does not exist", () => {
    const proxyDir = path.resolve(
      process.cwd(),
      "src/app/api/patient-backend",
    );
    expect(existsSync(proxyDir)).toBe(false);
  });
});
