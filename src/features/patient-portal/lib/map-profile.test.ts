import { describe, expect, it } from "vitest";
import { mapApiProfile } from "./map-profile";
import type { ApiPatientProfile } from "../data/patient-profile.api.types";

function profile(overrides: Partial<ApiPatientProfile> = {}): ApiPatientProfile {
  return {
    id: "p1",
    full_name: "Layla Hassan",
    national_id: "12345678901234",
    date_of_birth: "1990-01-01",
    phone_number: "01012345678",
    address: "Cairo",
    marital_status: "MARRIED",
    profile_image_url: "https://x/avatar.png",
    ...overrides,
  };
}

describe("mapApiProfile", () => {
  it("maps the snake_case wire shape to the camelCase view model", () => {
    expect(mapApiProfile(profile())).toEqual({
      id: "p1",
      fullName: "Layla Hassan",
      nationalId: "12345678901234",
      dateOfBirth: "1990-01-01",
      phoneNumber: "01012345678",
      address: "Cairo",
      maritalStatus: "MARRIED",
      imageUrl: "https://x/avatar.png",
    });
  });

  it("passes through every known marital status", () => {
    for (const status of [
      "SINGLE",
      "MARRIED",
      "DIVORCED",
      "WIDOWED",
      "SEPARATED",
      "ENGAGED",
      "UNKNOWN",
    ]) {
      expect(mapApiProfile(profile({ marital_status: status })).maritalStatus).toBe(
        status,
      );
    }
  });

  it("narrows an unrecognized marital status to UNKNOWN", () => {
    expect(mapApiProfile(profile({ marital_status: "COMPLICATED" })).maritalStatus).toBe(
      "UNKNOWN",
    );
  });

  it("keeps a null avatar as null", () => {
    expect(mapApiProfile(profile({ profile_image_url: null })).imageUrl).toBeNull();
  });
});
