import { afterEach, describe, expect, it, vi } from "vitest";
import { isIOS, isStandalone } from "../platform";

const IPHONE_UA =
  "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1";
const IPADOS_UA =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Safari/605.1.15";
const MAC_UA =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36";
const ANDROID_UA =
  "Mozilla/5.0 (Linux; Android 14) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Mobile Safari/537.36";

function stubNavigator(nav: Partial<Navigator> & Record<string, unknown>) {
  vi.stubGlobal("navigator", nav);
}

function stubMatchMedia(standalone: boolean) {
  vi.stubGlobal(
    "matchMedia",
    (query: string) =>
      ({
        matches: query.includes("standalone") ? standalone : false,
      }) as MediaQueryList,
  );
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("isIOS", () => {
  it("detects an iPhone", () => {
    stubNavigator({ userAgent: IPHONE_UA, maxTouchPoints: 5 });
    expect(isIOS()).toBe(true);
  });

  it("detects iPadOS reporting a desktop-Mac UA with touch points", () => {
    stubNavigator({ userAgent: IPADOS_UA, maxTouchPoints: 5 });
    expect(isIOS()).toBe(true);
  });

  it("does not treat a real Mac (no touch) as iOS", () => {
    stubNavigator({ userAgent: MAC_UA, maxTouchPoints: 0 });
    expect(isIOS()).toBe(false);
  });

  it("does not treat Android as iOS", () => {
    stubNavigator({ userAgent: ANDROID_UA, maxTouchPoints: 5 });
    expect(isIOS()).toBe(false);
  });

  it("returns false when navigator is undefined (SSR)", () => {
    vi.stubGlobal("navigator", undefined);
    expect(isIOS()).toBe(false);
  });
});

describe("isStandalone", () => {
  it("is true when display-mode: standalone matches", () => {
    stubNavigator({ userAgent: ANDROID_UA, maxTouchPoints: 5 });
    stubMatchMedia(true);
    expect(isStandalone()).toBe(true);
  });

  it("is true via the iOS navigator.standalone flag", () => {
    stubNavigator({ userAgent: IPHONE_UA, maxTouchPoints: 5, standalone: true });
    stubMatchMedia(false);
    expect(isStandalone()).toBe(true);
  });

  it("is false in a normal browser tab", () => {
    stubNavigator({ userAgent: ANDROID_UA, maxTouchPoints: 5 });
    stubMatchMedia(false);
    expect(isStandalone()).toBe(false);
  });
});
