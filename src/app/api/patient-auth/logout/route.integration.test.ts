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

import { POST } from "./route";

let fetchMock: ReturnType<typeof vi.fn>;

beforeEach(() => {
  cookieStore.map.clear();
  fetchMock = vi.fn(async () => new Response("{}", { status: 200 }));
  vi.stubGlobal("fetch", fetchMock);
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("POST /api/patient-auth/logout", () => {
  it("clears the session cookies and reports unauthenticated", async () => {
    cookieStore.map.set(PATIENT_AUTH_REFRESH_TOKEN_COOKIE, "r");
    const res = await POST();

    expect(res.cookies.get(PATIENT_AUTH_TOKEN_COOKIE)?.value).toBe("");
    expect(res.cookies.get(PATIENT_AUTH_REFRESH_TOKEN_COOKIE)?.value).toBe("");
    await expect(res.json()).resolves.toMatchObject({
      data: { authenticated: false },
    });
  });

  it("best-effort revokes the refresh token at the backend when present", async () => {
    cookieStore.map.set(PATIENT_AUTH_REFRESH_TOKEN_COOKIE, "r");
    await POST();
    expect(fetchMock.mock.calls[0][0]).toContain("/patient-auth/logout");
  });

  it("skips the backend call when there is no refresh cookie", async () => {
    const res = await POST();
    expect(fetchMock).not.toHaveBeenCalled();
    expect(res.cookies.get(PATIENT_AUTH_TOKEN_COOKIE)?.value).toBe("");
  });

  it("still clears cookies even if the backend revocation fails", async () => {
    cookieStore.map.set(PATIENT_AUTH_REFRESH_TOKEN_COOKIE, "r");
    fetchMock.mockRejectedValueOnce(new Error("network down"));
    const res = await POST();
    expect(res.cookies.get(PATIENT_AUTH_REFRESH_TOKEN_COOKIE)?.value).toBe("");
    await expect(res.json()).resolves.toMatchObject({
      data: { authenticated: false },
    });
  });
});
