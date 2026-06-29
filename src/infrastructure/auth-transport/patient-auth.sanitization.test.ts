import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { PATIENT_AUTH_TOKEN_COOKIE } from "./constants";

// In-memory cookie store mock — route logic only READS cookies (writes land on
// the NextResponse), so a `get` is all that's needed. Mirrors the pattern in
// patient-auth.integration.test.ts.
const cookieStore = vi.hoisted(() => {
  const map = new Map<string, string>();
  return {
    map,
    get: (name: string) => {
      const value = map.get(name);
      return value === undefined ? undefined : { name, value };
    },
  };
});

vi.mock("next/headers", () => ({
  cookies: async () => ({ get: cookieStore.get }),
}));

import {
  patientLoginResponse,
  proxyAuthenticatedPatientRequest,
} from "./patient-auth";

function jwt(expSecondsFromNow: number): string {
  const header = btoa(JSON.stringify({ alg: "HS256", typ: "JWT" }));
  const payload = btoa(
    JSON.stringify({ exp: Math.floor(Date.now() / 1000) + expSecondsFromNow }),
  )
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
  return `${header}.${payload}.sig`;
}

const VALID_ACCESS = jwt(3600);

function backendJson(body: unknown, status = 200) {
  return new Response(body === null ? null : JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

function portalRequest() {
  return new NextRequest(
    new URL("http://localhost:3200/api/patient-portal/journey"),
    { method: "GET" },
  );
}

let fetchMock: ReturnType<typeof vi.fn>;
let errorSpy: ReturnType<typeof vi.spyOn>;

beforeEach(() => {
  cookieStore.map.clear();
  fetchMock = vi.fn();
  vi.stubGlobal("fetch", fetchMock);
  // The proxy logs full 5xx bodies server-side; silence it in tests.
  errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
});

afterEach(() => {
  vi.unstubAllGlobals();
  errorSpy.mockRestore();
});

describe("proxyAuthenticatedPatientRequest — error sanitization", () => {
  it("collapses a 5xx backend error to a generic message (no internal leak)", async () => {
    cookieStore.map.set(PATIENT_AUTH_TOKEN_COOKIE, VALID_ACCESS);
    fetchMock.mockResolvedValueOnce(
      backendJson(
        { message: "psycopg2 OperationalError on db-prod-01", stack: "…" },
        500,
      ),
    );

    const res = await proxyAuthenticatedPatientRequest(
      portalRequest(),
      "/patient-portal/journey",
    );

    expect(res.status).toBe(500);
    await expect(res.json()).resolves.toEqual({
      message: "Something went wrong. Please try again.",
    });
  });

  it("keeps a safe 4xx message + field errors but drops internal keys", async () => {
    cookieStore.map.set(PATIENT_AUTH_TOKEN_COOKIE, VALID_ACCESS);
    fetchMock.mockResolvedValueOnce(
      backendJson(
        {
          message: "Validation failed",
          errors: [{ field: "dob", message: "invalid", internalCode: 9 }],
          query: "SELECT * FROM patients WHERE id = …",
        },
        422,
      ),
    );

    const res = await proxyAuthenticatedPatientRequest(
      portalRequest(),
      "/patient-portal/journey",
    );

    expect(res.status).toBe(422);
    await expect(res.json()).resolves.toEqual({
      message: "Validation failed",
      errors: [{ field: "dob", message: "invalid" }],
    });
  });

  it("passes a successful body through untouched (patient's own data)", async () => {
    cookieStore.map.set(PATIENT_AUTH_TOKEN_COOKIE, VALID_ACCESS);
    fetchMock.mockResolvedValueOnce(
      backendJson({ data: [{ id: "j1", stage: "ANC" }], meta: {} }),
    );

    const res = await proxyAuthenticatedPatientRequest(
      portalRequest(),
      "/patient-portal/journey",
    );

    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toEqual({
      data: [{ id: "j1", stage: "ANC" }],
      meta: {},
    });
  });
});

describe("patientLoginResponse — error sanitization", () => {
  it("collapses a 5xx login error to a generic message", async () => {
    fetchMock.mockResolvedValueOnce(
      backendJson({ message: "redis timeout at 10.0.0.5:6379" }, 503),
    );

    const res = await patientLoginResponse(
      new Request("http://localhost/api/patient-auth/login", {
        method: "POST",
        body: "{}",
      }),
    );

    expect(res.status).toBe(503);
    await expect(res.json()).resolves.toEqual({
      message: "Something went wrong. Please try again.",
    });
  });

  it("preserves a safe 401 message so the user sees why login failed", async () => {
    fetchMock.mockResolvedValueOnce(
      backendJson({ message: "Invalid credentials" }, 401),
    );

    const res = await patientLoginResponse(
      new Request("http://localhost/api/patient-auth/login", {
        method: "POST",
        body: "{}",
      }),
    );

    expect(res.status).toBe(401);
    await expect(res.json()).resolves.toEqual({
      message: "Invalid credentials",
    });
  });
});
