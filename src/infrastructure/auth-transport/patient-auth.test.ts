import { describe, expect, it } from "vitest";
import { NextResponse } from "next/server";
import {
  clearPatientAuthCookies,
  clearPatientResetTokenCookie,
  clearPatientSignupTokenCookie,
  setPatientAuthCookies,
  setPatientResetTokenCookie,
  setPatientSignupTokenCookie,
} from "./patient-auth";
import {
  PATIENT_AUTH_REFRESH_TOKEN_COOKIE,
  PATIENT_AUTH_REFRESH_TOKEN_MAX_AGE,
  PATIENT_AUTH_TOKEN_COOKIE,
  PATIENT_RESET_TOKEN_COOKIE,
  PATIENT_RESET_TOKEN_MAX_AGE,
  PATIENT_SIGNUP_TOKEN_COOKIE,
  PATIENT_SIGNUP_TOKEN_MAX_AGE,
} from "./constants";
import type { AuthTokens } from "./types";

const TOKENS: AuthTokens = {
  access_token: "p-access",
  refresh_token: "p-refresh",
  token_type: "Bearer",
  expires_in: 1800,
};

describe("setPatientAuthCookies", () => {
  it("sets HttpOnly access + refresh cookies with the right maxAge", () => {
    const res = NextResponse.json({});
    setPatientAuthCookies(res, TOKENS);

    const access = res.cookies.get(PATIENT_AUTH_TOKEN_COOKIE);
    const refresh = res.cookies.get(PATIENT_AUTH_REFRESH_TOKEN_COOKIE);

    expect(access?.value).toBe("p-access");
    expect(access?.httpOnly).toBe(true);
    expect(access?.sameSite).toBe("lax");
    expect(access?.path).toBe("/");
    expect(access?.maxAge).toBe(1800);
    expect(refresh?.value).toBe("p-refresh");
    expect(refresh?.maxAge).toBe(PATIENT_AUTH_REFRESH_TOKEN_MAX_AGE);
  });

  it("clamps a negative expires_in to maxAge 0", () => {
    const res = NextResponse.json({});
    setPatientAuthCookies(res, { ...TOKENS, expires_in: -10 });
    expect(res.cookies.get(PATIENT_AUTH_TOKEN_COOKIE)?.maxAge).toBe(0);
  });
});

describe("clearPatientAuthCookies", () => {
  it("empties access, refresh, AND the signup token cookie", () => {
    const res = NextResponse.json({});
    clearPatientAuthCookies(res);

    expect(res.cookies.get(PATIENT_AUTH_TOKEN_COOKIE)?.value).toBe("");
    expect(res.cookies.get(PATIENT_AUTH_TOKEN_COOKIE)?.maxAge).toBe(0);
    expect(res.cookies.get(PATIENT_AUTH_REFRESH_TOKEN_COOKIE)?.value).toBe("");
    expect(res.cookies.get(PATIENT_SIGNUP_TOKEN_COOKIE)?.value).toBe("");
    expect(res.cookies.get(PATIENT_SIGNUP_TOKEN_COOKIE)?.maxAge).toBe(0);
  });
});

describe("signup token cookie", () => {
  it("sets the signup token with the default TTL", () => {
    const res = NextResponse.json({});
    setPatientSignupTokenCookie(res, "signup-tok");
    const c = res.cookies.get(PATIENT_SIGNUP_TOKEN_COOKIE);
    expect(c?.value).toBe("signup-tok");
    expect(c?.maxAge).toBe(PATIENT_SIGNUP_TOKEN_MAX_AGE);
    expect(c?.httpOnly).toBe(true);
  });

  it("honors a custom maxAge and clamps negatives to 0", () => {
    const res = NextResponse.json({});
    setPatientSignupTokenCookie(res, "t", 120);
    expect(res.cookies.get(PATIENT_SIGNUP_TOKEN_COOKIE)?.maxAge).toBe(120);

    const res2 = NextResponse.json({});
    setPatientSignupTokenCookie(res2, "t", -1);
    expect(res2.cookies.get(PATIENT_SIGNUP_TOKEN_COOKIE)?.maxAge).toBe(0);
  });

  it("clears the signup token", () => {
    const res = NextResponse.json({});
    clearPatientSignupTokenCookie(res);
    expect(res.cookies.get(PATIENT_SIGNUP_TOKEN_COOKIE)?.value).toBe("");
    expect(res.cookies.get(PATIENT_SIGNUP_TOKEN_COOKIE)?.maxAge).toBe(0);
  });
});

describe("reset token cookie", () => {
  it("sets the reset token with the default TTL", () => {
    const res = NextResponse.json({});
    setPatientResetTokenCookie(res, "reset-tok");
    const c = res.cookies.get(PATIENT_RESET_TOKEN_COOKIE);
    expect(c?.value).toBe("reset-tok");
    expect(c?.maxAge).toBe(PATIENT_RESET_TOKEN_MAX_AGE);
    expect(c?.httpOnly).toBe(true);
  });

  it("clears the reset token", () => {
    const res = NextResponse.json({});
    clearPatientResetTokenCookie(res);
    expect(res.cookies.get(PATIENT_RESET_TOKEN_COOKIE)?.value).toBe("");
    expect(res.cookies.get(PATIENT_RESET_TOKEN_COOKIE)?.maxAge).toBe(0);
  });
});
