import { afterEach, describe, expect, it, vi } from "vitest";
import { isExpiredJwt, JWT_EXPIRY_LEEWAY_MS } from "./jwt";

/**
 * Build a JWT-shaped string whose payload base64url-encodes `payload`.
 * Signature is irrelevant to `isExpiredJwt` (it never verifies), so a stub is fine.
 */
function makeToken(payload: Record<string, unknown>): string {
  const header = btoa(JSON.stringify({ alg: "HS256", typ: "JWT" }));
  const body = btoa(JSON.stringify(payload))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
  return `${header}.${body}.signature`;
}

const NOW = new Date("2026-06-29T00:00:00.000Z").getTime();

describe("isExpiredJwt", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("treats a token with no payload segment as NOT expired", () => {
    // Documented behavior: malformed input fails open (backend is source of truth).
    expect(isExpiredJwt("onlyonesegment")).toBe(false);
  });

  it("treats a garbage / unparseable payload as NOT expired", () => {
    expect(isExpiredJwt("aaa.!!!notbase64!!!.bbb")).toBe(false);
  });

  it("treats a payload without `exp` as NOT expired", () => {
    expect(isExpiredJwt(makeToken({ sub: "patient-1" }))).toBe(false);
  });

  it("returns false for a token expiring comfortably in the future", () => {
    vi.useFakeTimers();
    vi.setSystemTime(NOW);
    const exp = Math.floor(NOW / 1000) + 3600; // +1h
    expect(isExpiredJwt(makeToken({ exp }))).toBe(false);
  });

  it("returns true for a token whose exp is in the past", () => {
    vi.useFakeTimers();
    vi.setSystemTime(NOW);
    const exp = Math.floor(NOW / 1000) - 3600; // -1h
    expect(isExpiredJwt(makeToken({ exp }))).toBe(true);
  });

  it("treats a token expiring within the leeway window as expired", () => {
    vi.useFakeTimers();
    vi.setSystemTime(NOW);
    // exp is 5s in the future, but leeway is 10s, so it should already be expired.
    const exp = Math.floor(NOW / 1000) + 5;
    expect(JWT_EXPIRY_LEEWAY_MS).toBe(10_000);
    expect(isExpiredJwt(makeToken({ exp }))).toBe(true);
  });

  it("treats a token expiring just beyond the leeway window as NOT expired", () => {
    vi.useFakeTimers();
    vi.setSystemTime(NOW);
    // exp is 15s out, beyond the 10s leeway → still valid.
    const exp = Math.floor(NOW / 1000) + 15;
    expect(isExpiredJwt(makeToken({ exp }))).toBe(false);
  });

  it("decodes base64url payloads containing - and _ characters", () => {
    vi.useFakeTimers();
    vi.setSystemTime(NOW);
    // Force `-`/`_` in the encoded payload by padding the value until they appear.
    const exp = Math.floor(NOW / 1000) + 3600;
    const token = makeToken({ exp, note: "??>>??>>" });
    expect(token.split(".")[1]).toMatch(/[-_]/);
    expect(isExpiredJwt(token)).toBe(false);
  });

  it("ignores a non-numeric exp (treats as NOT expired)", () => {
    expect(isExpiredJwt(makeToken({ exp: "not-a-number" }))).toBe(false);
  });
});
