import { describe, expect, it } from "vitest";
import { canShowInstall, SNOOZE_MS } from "../snooze";

const NOW = 1_700_000_000_000;

describe("canShowInstall", () => {
  it("never offers install once the app is installed", () => {
    expect(
      canShowInstall({ installed: true, dismissedAt: null, now: NOW }),
    ).toBe(false);
    // installed wins even if the snooze window has elapsed
    expect(
      canShowInstall({
        installed: true,
        dismissedAt: NOW - SNOOZE_MS - 1,
        now: NOW,
      }),
    ).toBe(false);
  });

  it("offers install when never dismissed", () => {
    expect(
      canShowInstall({ installed: false, dismissedAt: null, now: NOW }),
    ).toBe(true);
  });

  it("suppresses install within the 14-day snooze window", () => {
    expect(
      canShowInstall({
        installed: false,
        dismissedAt: NOW - (SNOOZE_MS - 1),
        now: NOW,
      }),
    ).toBe(false);
  });

  it("offers install again once the snooze window has fully elapsed", () => {
    expect(
      canShowInstall({
        installed: false,
        dismissedAt: NOW - (SNOOZE_MS + 1),
        now: NOW,
      }),
    ).toBe(true);
  });

  it("is still suppressed exactly at the snooze boundary (strictly greater)", () => {
    expect(
      canShowInstall({
        installed: false,
        dismissedAt: NOW - SNOOZE_MS,
        now: NOW,
      }),
    ).toBe(false);
  });
});
