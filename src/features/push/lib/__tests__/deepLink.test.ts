import { describe, expect, it } from "vitest";
import { localeFromClientUrls, resolvePatientDeepLink } from "../deepLink";

describe("resolvePatientDeepLink", () => {
  it("maps a bare portal path to /<locale>/patient/<path>", () => {
    expect(resolvePatientDeepLink("/tests", "ar")).toBe("/ar/patient/tests");
    expect(resolvePatientDeepLink("/medications", "en")).toBe(
      "/en/patient/medications",
    );
  });

  it("routes empty / null / '/' to the portal home", () => {
    expect(resolvePatientDeepLink(null, "en")).toBe("/en/patient");
    expect(resolvePatientDeepLink(undefined, "ar")).toBe("/ar/patient");
    expect(resolvePatientDeepLink("/", "en")).toBe("/en/patient");
  });

  it("falls back to the default locale for an unknown locale", () => {
    expect(resolvePatientDeepLink("/tests", "fr")).toBe("/en/patient/tests");
    expect(resolvePatientDeepLink("/tests", null)).toBe("/en/patient/tests");
  });
});

describe("localeFromClientUrls", () => {
  it("reads the locale from the first client whose path starts with a known locale", () => {
    expect(
      localeFromClientUrls(["https://app.cradlen.com/ar/patient/home"]),
    ).toBe("ar");
    expect(
      localeFromClientUrls([
        "https://app.cradlen.com/",
        "https://app.cradlen.com/en/patient/tests",
      ]),
    ).toBe("en");
  });

  it("falls back to the default locale when no client reveals one", () => {
    expect(localeFromClientUrls(["https://app.cradlen.com/patient/home"])).toBe(
      "en",
    );
    expect(localeFromClientUrls([])).toBe("en");
    expect(localeFromClientUrls(["not a url"])).toBe("en");
  });
});
