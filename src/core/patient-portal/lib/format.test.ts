import { afterEach, describe, expect, it, vi } from "vitest";
import {
  ageFromDob,
  formatDate,
  formatDateParts,
  formatDayMonth,
  formatRelative,
} from "./format";

const NOW = new Date("2026-06-29T12:00:00.000Z").getTime();

afterEach(() => {
  vi.useRealTimers();
});

describe("formatDate", () => {
  it("returns an em dash for undefined", () => {
    expect(formatDate(undefined, "en")).toBe("—");
  });

  it("returns the raw string when the date can't be parsed", () => {
    expect(formatDate("not-a-date", "en")).toBe("not-a-date");
  });

  it("formats a valid ISO date for the en locale", () => {
    expect(formatDate("2026-06-14T00:00:00.000Z", "en")).toContain("2026");
  });

  it("produces locale-specific output for ar", () => {
    const en = formatDate("2026-06-14T00:00:00.000Z", "en");
    const ar = formatDate("2026-06-14T00:00:00.000Z", "ar");
    expect(ar).not.toBe(en);
  });
});

describe("formatDateParts", () => {
  it("returns placeholder parts for undefined", () => {
    expect(formatDateParts(undefined, "en")).toEqual({ dayMonth: "—", year: "" });
  });

  it("falls back to raw string in dayMonth when unparseable", () => {
    expect(formatDateParts("garbage", "en")).toEqual({ dayMonth: "garbage", year: "" });
  });

  it("splits a valid date into dayMonth and year", () => {
    const parts = formatDateParts("2026-06-14T00:00:00.000Z", "en");
    expect(parts.year).toBe("2026");
    expect(parts.dayMonth).toMatch(/Jun/);
  });
});

describe("formatDayMonth", () => {
  it("returns an em dash for undefined", () => {
    expect(formatDayMonth(undefined, "en")).toBe("—");
  });

  it("includes a weekday for a valid date", () => {
    expect(formatDayMonth("2026-06-14T00:00:00.000Z", "en")).toMatch(/\w+/);
  });
});

describe("formatRelative", () => {
  it("returns an em dash for undefined", () => {
    expect(formatRelative(undefined, "en")).toBe("—");
  });

  it("uses the 'second' bucket for sub-minute differences", () => {
    vi.useFakeTimers();
    vi.setSystemTime(NOW);
    const iso = new Date(NOW - 30 * 1000).toISOString();
    expect(formatRelative(iso, "en")).toMatch(/second|now/i);
  });

  it("uses the 'hour' bucket for a few hours ago", () => {
    vi.useFakeTimers();
    vi.setSystemTime(NOW);
    const iso = new Date(NOW - 2 * 3600 * 1000).toISOString();
    expect(formatRelative(iso, "en")).toMatch(/hour/i);
  });

  it("falls back to an absolute date beyond ~30 days", () => {
    vi.useFakeTimers();
    vi.setSystemTime(NOW);
    const iso = new Date(NOW - 60 * 24 * 3600 * 1000).toISOString();
    expect(formatRelative(iso, "en")).toContain("2026");
  });
});

describe("ageFromDob", () => {
  it("returns undefined for missing or unparseable input", () => {
    expect(ageFromDob(undefined)).toBeUndefined();
    expect(ageFromDob("nope")).toBeUndefined();
  });

  it("computes a whole-year age mid-year", () => {
    vi.useFakeTimers();
    vi.setSystemTime(NOW);
    const dob = new Date("1996-01-01T12:00:00.000Z").toISOString();
    expect(ageFromDob(dob)).toBe(30);
  });

  it("counts the current year on the exact birthday", () => {
    vi.useFakeTimers();
    vi.setSystemTime(NOW); // 2026-06-29
    const dob = new Date("1996-06-29T12:00:00.000Z").toISOString();
    expect(ageFromDob(dob)).toBe(30);
  });

  it("does not count the current year before the birthday", () => {
    vi.useFakeTimers();
    vi.setSystemTime(NOW); // 2026-06-29
    const dob = new Date("1996-06-30T12:00:00.000Z").toISOString();
    expect(ageFromDob(dob)).toBe(29);
  });
});
