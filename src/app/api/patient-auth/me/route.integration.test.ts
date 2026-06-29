import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  PATIENT_AUTH_REFRESH_TOKEN_COOKIE,
  PATIENT_AUTH_TOKEN_COOKIE,
} from "@/infrastructure/auth-transport/constants";

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

import { GET } from "./route";

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

const VALID = jwt(3600);
const EXPIRED = jwt(-3600);

function backendJson(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
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

describe("GET /api/patient-auth/me", () => {
  it("401s and clears cookies when there is no usable token", async () => {
    const res = await GET();
    expect(res.status).toBe(401);
    expect(res.cookies.get(PATIENT_AUTH_TOKEN_COOKIE)?.value).toBe("");
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("returns the backend profile with a valid access token", async () => {
    cookieStore.map.set(PATIENT_AUTH_TOKEN_COOKIE, VALID);
    fetchMock.mockResolvedValueOnce(backendJson({ data: { patient_id: "p1" } }));

    const res = await GET();

    expect(res.status).toBe(200);
    const init = fetchMock.mock.calls[0][1] as RequestInit;
    expect((init.headers as Record<string, string>).Authorization).toBe(
      `Bearer ${VALID}`,
    );
    await expect(res.json()).resolves.toMatchObject({ data: { patient_id: "p1" } });
  });

  it("rotates an expired token and persists the new cookies", async () => {
    cookieStore.map.set(PATIENT_AUTH_TOKEN_COOKIE, EXPIRED);
    cookieStore.map.set(PATIENT_AUTH_REFRESH_TOKEN_COOKIE, "good-refresh");
    fetchMock
      .mockResolvedValueOnce(backendJson({ data: TOKENS })) // refresh
      .mockResolvedValueOnce(backendJson({ data: { patient_id: "p1" } })); // /me

    const res = await GET();

    expect(res.status).toBe(200);
    expect(res.cookies.get(PATIENT_AUTH_TOKEN_COOKIE)?.value).toBe("new-access");
  });

  it("clears cookies when the backend rejects with a 401", async () => {
    cookieStore.map.set(PATIENT_AUTH_TOKEN_COOKIE, VALID);
    fetchMock.mockResolvedValueOnce(backendJson({ message: "nope" }, 401));

    const res = await GET();

    expect(res.status).toBe(401);
    expect(res.cookies.get(PATIENT_AUTH_TOKEN_COOKIE)?.value).toBe("");
  });
});
