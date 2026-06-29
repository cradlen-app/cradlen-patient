import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import {
  PATIENT_AUTH_REFRESH_TOKEN_COOKIE,
  PATIENT_AUTH_TOKEN_COOKIE,
  PATIENT_RESET_TOKEN_COOKIE,
  PATIENT_SIGNUP_TOKEN_COOKIE,
} from "./constants";

// --- next/headers cookie store mock -------------------------------------------
// A simple in-memory store seeded per test. Route logic only ever READS cookies
// (writes go onto the NextResponse), so a `get` is all that's needed.
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
  getValidPatientAccessToken,
  patientForgotPasswordCompleteResponse,
  patientForgotPasswordStartResponse,
  patientLoginResponse,
  patientSignupCompleteResponse,
  patientSignupStartResponse,
  proxyAuthenticatedPatientRequest,
} from "./patient-auth";

// --- helpers ------------------------------------------------------------------
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
const EXPIRED_ACCESS = jwt(-3600);

function backendJson(body: unknown, status = 200) {
  return new Response(body === null ? null : JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

const TOKENS = {
  access_token: "new-access",
  refresh_token: "new-refresh",
  token_type: "Bearer",
  expires_in: 1800,
};

let fetchMock: ReturnType<typeof vi.fn>;

beforeEach(() => {
  cookieStore.map.clear();
  fetchMock = vi.fn();
  vi.stubGlobal("fetch", fetchMock);
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("patientLoginResponse", () => {
  it("sets patient auth cookies and returns authenticated on success", async () => {
    fetchMock.mockResolvedValueOnce(backendJson({ data: TOKENS }));
    const res = await patientLoginResponse(
      new Request("http://localhost/api/patient-auth/login", {
        method: "POST",
        body: JSON.stringify({ national_id: "1", password: "x" }),
      }),
    );

    expect(res.status).toBe(200);
    expect(res.cookies.get(PATIENT_AUTH_TOKEN_COOKIE)?.value).toBe("new-access");
    expect(res.cookies.get(PATIENT_AUTH_REFRESH_TOKEN_COOKIE)?.value).toBe(
      "new-refresh",
    );
    // Backend was called at the login path.
    expect(fetchMock.mock.calls[0][0]).toContain("/patient-auth/login");
  });

  it("passes through a backend error without setting cookies", async () => {
    fetchMock.mockResolvedValueOnce(
      backendJson({ message: "Invalid credentials" }, 401),
    );
    const res = await patientLoginResponse(
      new Request("http://localhost/api/patient-auth/login", { method: "POST", body: "{}" }),
    );

    expect(res.status).toBe(401);
    expect(res.cookies.get(PATIENT_AUTH_TOKEN_COOKIE)?.value).toBeFalsy();
  });

  it("treats a 200 with no tokens as an error passthrough", async () => {
    fetchMock.mockResolvedValueOnce(backendJson({ data: { nope: true } }));
    const res = await patientLoginResponse(
      new Request("http://localhost/api/patient-auth/login", { method: "POST", body: "{}" }),
    );
    expect(res.cookies.get(PATIENT_AUTH_TOKEN_COOKIE)?.value).toBeFalsy();
  });
});

describe("patientSignupStartResponse", () => {
  it("stores the signup token cookie and returns expires_in", async () => {
    fetchMock.mockResolvedValueOnce(
      backendJson({ data: { patient_signup_token: "sg-tok", expires_in: 1800 } }),
    );
    const res = await patientSignupStartResponse(
      new Request("http://localhost/api/patient-auth/signup/start", {
        method: "POST",
        body: "{}",
      }),
    );

    expect(res.status).toBe(200);
    expect(res.cookies.get(PATIENT_SIGNUP_TOKEN_COOKIE)?.value).toBe("sg-tok");
    await expect(res.json()).resolves.toMatchObject({ data: { expires_in: 1800 } });
  });
});

describe("patientSignupCompleteResponse", () => {
  it("401s when there is no signup token cookie", async () => {
    const res = await patientSignupCompleteResponse(
      new Request("http://localhost/api/patient-auth/signup/complete", {
        method: "POST",
        body: JSON.stringify({ password: "x" }),
      }),
    );
    expect(res.status).toBe(401);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("completes signup, sets auth cookies, and clears the signup token", async () => {
    cookieStore.map.set(PATIENT_SIGNUP_TOKEN_COOKIE, "sg-tok");
    fetchMock.mockResolvedValueOnce(backendJson({ data: TOKENS }, 201));

    const res = await patientSignupCompleteResponse(
      new Request("http://localhost/api/patient-auth/signup/complete", {
        method: "POST",
        body: JSON.stringify({
          password: "Abcdef1!",
          confirm_password: "Abcdef1!",
          security_question: "BIRTH_CITY",
          security_answer: "Cairo",
        }),
      }),
    );

    expect(res.status).toBe(201);
    expect(res.cookies.get(PATIENT_AUTH_TOKEN_COOKIE)?.value).toBe("new-access");
    // Spent signup token is cleared.
    expect(res.cookies.get(PATIENT_SIGNUP_TOKEN_COOKIE)?.value).toBe("");
  });
});

describe("patientForgotPasswordStartResponse", () => {
  it("stores the reset token and returns the security question", async () => {
    fetchMock.mockResolvedValueOnce(
      backendJson({
        data: { reset_token: "rs-tok", security_question: "BIRTH_CITY", expires_in: 1800 },
      }),
    );
    const res = await patientForgotPasswordStartResponse(
      new Request("http://localhost/api/patient-auth/forgot-password/start", {
        method: "POST",
        body: "{}",
      }),
    );

    expect(res.cookies.get(PATIENT_RESET_TOKEN_COOKIE)?.value).toBe("rs-tok");
    await expect(res.json()).resolves.toMatchObject({
      data: { security_question: "BIRTH_CITY" },
    });
  });
});

describe("patientForgotPasswordCompleteResponse", () => {
  it("401s without a reset token cookie", async () => {
    const res = await patientForgotPasswordCompleteResponse(
      new Request("http://localhost/api/patient-auth/forgot-password/complete", {
        method: "POST",
        body: "{}",
      }),
    );
    expect(res.status).toBe(401);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("clears the reset token after a successful reset", async () => {
    cookieStore.map.set(PATIENT_RESET_TOKEN_COOKIE, "rs-tok");
    fetchMock.mockResolvedValueOnce(backendJson(null, 204));

    const res = await patientForgotPasswordCompleteResponse(
      new Request("http://localhost/api/patient-auth/forgot-password/complete", {
        method: "POST",
        body: JSON.stringify({ security_answer: "Cairo", password: "Abcdef1!", confirm_password: "Abcdef1!" }),
      }),
    );

    expect(res.status).toBe(200);
    expect(res.cookies.get(PATIENT_RESET_TOKEN_COOKIE)?.value).toBe("");
  });
});

describe("getValidPatientAccessToken", () => {
  it("returns the access token unchanged when it is still valid", async () => {
    cookieStore.map.set(PATIENT_AUTH_TOKEN_COOKIE, VALID_ACCESS);
    cookieStore.map.set(PATIENT_AUTH_REFRESH_TOKEN_COOKIE, "r");

    const result = await getValidPatientAccessToken();
    expect(result.accessToken).toBe(VALID_ACCESS);
    expect(result.refreshedTokens).toBeNull();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("returns null when there is no token at all", async () => {
    const result = await getValidPatientAccessToken();
    expect(result.accessToken).toBeNull();
  });

  it("rotates an expired access token via the refresh cookie", async () => {
    cookieStore.map.set(PATIENT_AUTH_TOKEN_COOKIE, EXPIRED_ACCESS);
    cookieStore.map.set(PATIENT_AUTH_REFRESH_TOKEN_COOKIE, "good-refresh");
    fetchMock.mockResolvedValueOnce(backendJson({ data: TOKENS }));

    const result = await getValidPatientAccessToken();
    expect(result.accessToken).toBe("new-access");
    expect(result.refreshedTokens).toMatchObject({ access_token: "new-access" });
    expect(fetchMock.mock.calls[0][0]).toContain("/patient-auth/refresh");
  });

  it("flags a TERMINAL failure when the backend rejects the refresh token (401)", async () => {
    cookieStore.map.set(PATIENT_AUTH_TOKEN_COOKIE, EXPIRED_ACCESS);
    cookieStore.map.set(PATIENT_AUTH_REFRESH_TOKEN_COOKIE, "rejected-refresh");
    fetchMock.mockResolvedValueOnce(backendJson({ message: "bad" }, 401));

    const result = await getValidPatientAccessToken();
    expect(result.accessToken).toBeNull();
    expect(result.refreshFailure).toBe("terminal");
  });

  it("flags a TRANSIENT failure when the refresh request errors (network)", async () => {
    cookieStore.map.set(PATIENT_AUTH_TOKEN_COOKIE, EXPIRED_ACCESS);
    cookieStore.map.set(PATIENT_AUTH_REFRESH_TOKEN_COOKIE, "net-refresh");
    fetchMock.mockRejectedValueOnce(new Error("ECONNRESET"));

    const result = await getValidPatientAccessToken();
    expect(result.accessToken).toBeNull();
    expect(result.refreshFailure).toBe("transient");
  });

  it("flags a TRANSIENT failure when the refresh returns 5xx", async () => {
    cookieStore.map.set(PATIENT_AUTH_TOKEN_COOKIE, EXPIRED_ACCESS);
    cookieStore.map.set(PATIENT_AUTH_REFRESH_TOKEN_COOKIE, "5xx-refresh");
    fetchMock.mockResolvedValueOnce(backendJson({ message: "down" }, 503));

    const result = await getValidPatientAccessToken();
    expect(result.accessToken).toBeNull();
    expect(result.refreshFailure).toBe("transient");
  });
});

describe("proxyAuthenticatedPatientRequest", () => {
  function portalRequest() {
    return new NextRequest(
      new URL("http://localhost:3200/api/patient-portal/journey"),
      { method: "GET" },
    );
  }

  it("forwards the request with a Bearer token and returns the backend body", async () => {
    cookieStore.map.set(PATIENT_AUTH_TOKEN_COOKIE, VALID_ACCESS);
    fetchMock.mockResolvedValueOnce(backendJson({ data: ["episode"] }));

    const res = await proxyAuthenticatedPatientRequest(portalRequest(), "/patient-portal/journey");

    expect(res.status).toBe(200);
    const init = fetchMock.mock.calls[0][1] as RequestInit;
    expect((init.headers as Record<string, string>).Authorization).toBe(
      `Bearer ${VALID_ACCESS}`,
    );
  });

  it("401s and clears cookies when there is no usable token", async () => {
    const res = await proxyAuthenticatedPatientRequest(portalRequest(), "/patient-portal/journey");
    expect(res.status).toBe(401);
    expect(res.cookies.get(PATIENT_AUTH_TOKEN_COOKIE)?.value).toBe("");
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("persists rotated cookies when the access token was refreshed", async () => {
    cookieStore.map.set(PATIENT_AUTH_TOKEN_COOKIE, EXPIRED_ACCESS);
    cookieStore.map.set(PATIENT_AUTH_REFRESH_TOKEN_COOKIE, "good-refresh");
    // 1) refresh call, 2) the proxied backend call.
    fetchMock
      .mockResolvedValueOnce(backendJson({ data: TOKENS }))
      .mockResolvedValueOnce(backendJson({ data: ["episode"] }));

    const res = await proxyAuthenticatedPatientRequest(portalRequest(), "/patient-portal/journey");

    expect(res.status).toBe(200);
    expect(res.cookies.get(PATIENT_AUTH_TOKEN_COOKIE)?.value).toBe("new-access");
  });

  it("clears cookies when the backend rejects the token with a 401", async () => {
    cookieStore.map.set(PATIENT_AUTH_TOKEN_COOKIE, VALID_ACCESS);
    fetchMock.mockResolvedValueOnce(backendJson({ message: "nope" }, 401));

    const res = await proxyAuthenticatedPatientRequest(portalRequest(), "/patient-portal/journey");

    expect(res.status).toBe(401);
    expect(res.cookies.get(PATIENT_AUTH_TOKEN_COOKIE)?.value).toBe("");
  });

  it("clears cookies and 401s on a TERMINAL refresh failure", async () => {
    cookieStore.map.set(PATIENT_AUTH_TOKEN_COOKIE, EXPIRED_ACCESS);
    cookieStore.map.set(PATIENT_AUTH_REFRESH_TOKEN_COOKIE, "rejected-refresh");
    fetchMock.mockResolvedValueOnce(backendJson({ message: "bad" }, 401));

    const res = await proxyAuthenticatedPatientRequest(portalRequest(), "/patient-portal/journey");

    expect(res.status).toBe(401);
    expect(res.cookies.get(PATIENT_AUTH_TOKEN_COOKIE)?.value).toBe("");
  });

  it("returns 503 and KEEPS cookies on a TRANSIENT refresh failure", async () => {
    cookieStore.map.set(PATIENT_AUTH_TOKEN_COOKIE, EXPIRED_ACCESS);
    cookieStore.map.set(PATIENT_AUTH_REFRESH_TOKEN_COOKIE, "blip-refresh");
    // Refresh request errors → transient → session must survive.
    fetchMock.mockRejectedValueOnce(new Error("ECONNRESET"));

    const res = await proxyAuthenticatedPatientRequest(portalRequest(), "/patient-portal/journey");

    expect(res.status).toBe(503);
    expect(res.headers.get("Retry-After")).toBe("1");
    // No Set-Cookie clearing the session.
    expect(res.cookies.get(PATIENT_AUTH_TOKEN_COOKIE)?.value).toBeFalsy();
    expect(res.cookies.get(PATIENT_AUTH_TOKEN_COOKIE)?.maxAge).toBeUndefined();
  });
});
