import { describe, expect, it } from "vitest";
import type { ErrorEvent } from "@sentry/nextjs";
import { scrubEvent } from "./sentry-scrub";

/** Build a minimal ErrorEvent; cast keeps the test focused on scrubbed shapes. */
function event(partial: Record<string, unknown>): ErrorEvent {
  return { type: undefined, ...partial } as unknown as ErrorEvent;
}

describe("scrubEvent", () => {
  it("redacts sensitive keys in request data (national id, password, token)", () => {
    const out = scrubEvent(
      event({
        request: {
          data: {
            national_id: "29001011234567",
            password: "hunter2",
            refresh_token: "abc",
            page: 2,
          },
        },
      }),
    );
    const data = out.request?.data as Record<string, unknown>;
    expect(data.national_id).toBe("[redacted]");
    expect(data.password).toBe("[redacted]");
    expect(data.refresh_token).toBe("[redacted]");
    expect(data.page).toBe(2); // non-sensitive preserved
  });

  it("redacts nested and arrayed PII", () => {
    const out = scrubEvent(
      event({
        extra: {
          patients: [{ full_name: "Sara", dob: "1990-01-01", id: "p1" }],
        },
      }),
    );
    const patients = (out.extra as { patients: Record<string, unknown>[] })
      .patients;
    expect(patients[0].full_name).toBe("[redacted]");
    expect(patients[0].dob).toBe("[redacted]");
    expect(patients[0].id).toBe("p1");
  });

  it("strips the query string from request url and breadcrumb messages", () => {
    const out = scrubEvent(
      event({
        request: { url: "https://app/api/patient-portal/visits?patient_id=p1" },
        breadcrumbs: [
          { message: "GET /api/patient-portal/profile?patient_id=p1" },
        ],
      }),
    );
    expect(out.request?.url).toBe("https://app/api/patient-portal/visits");
    expect(out.breadcrumbs?.[0].message).toBe("GET /api/patient-portal/profile");
  });

  it("drops cookies and sensitive headers", () => {
    const out = scrubEvent(
      event({
        request: {
          cookies: { "cradlen-patient-token": "jwt" },
          headers: { authorization: "Bearer x", "content-type": "application/json" },
        },
      }),
    );
    expect(out.request?.cookies).toBeUndefined();
    expect(out.request?.headers?.authorization).toBeUndefined();
    expect(out.request?.headers?.["content-type"]).toBe("application/json");
  });

  it("is a no-op-safe pass when there is nothing sensitive", () => {
    const out = scrubEvent(event({ message: "boom", level: "error" }));
    expect(out.message).toBe("boom");
  });
});
