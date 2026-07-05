import { afterEach, describe, expect, it, vi } from "vitest";
import { urlBase64ToUint8Array } from "../vapid";

afterEach(() => vi.unstubAllGlobals());

describe("urlBase64ToUint8Array", () => {
  it("decodes a base64url string to the raw key bytes", () => {
    // "hello" base64 is "aGVsbG8="; base64url drops padding.
    const out = urlBase64ToUint8Array("aGVsbG8");
    expect(Array.from(out)).toEqual([104, 101, 108, 108, 111]);
    expect(out.buffer).toBeInstanceOf(ArrayBuffer);
  });

  it("restores base64url substitutions (- _ ) and padding", () => {
    // 0xFB 0xFF encodes as "-_8" in base64url ("+/8" in standard base64).
    const out = urlBase64ToUint8Array("-_8");
    expect(Array.from(out)).toEqual([251, 255]);
  });
});
