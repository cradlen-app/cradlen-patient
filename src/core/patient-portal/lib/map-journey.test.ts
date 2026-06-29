import { describe, expect, it } from "vitest";
import { mapApiJourney } from "./map-journey";
import type {
  ApiPatientJourney,
  ApiPatientPregnancy,
} from "../data/patient-journey.api.types";

function pregnancy(
  overrides: Partial<ApiPatientPregnancy> = {},
): ApiPatientPregnancy {
  return {
    gestational_age_weeks: 24,
    gestational_age_days: 3,
    estimated_due_date: "2026-10-01T00:00:00.000Z",
    number_of_fetuses: 1,
    pregnancy_type: "singleton",
    fetal_sexes: "Girl",
    risk_level: "low",
    ...overrides,
  };
}

function journey(overrides: Partial<ApiPatientJourney> = {}): ApiPatientJourney {
  return {
    journey_id: "j1",
    care_path_code: "OBGYN_PREGNANCY",
    specialty_code: "OBGYN",
    label: "Pregnancy",
    status: "ACTIVE",
    started_at: "2026-01-01T00:00:00.000Z",
    stages: [
      { id: "s1", name: "First trimester", order: 1, status: "DONE" },
      { id: "s2", name: "Second trimester", order: 2, status: "CURRENT" },
      { id: "s3", name: "Third trimester", order: 3, status: "UPCOMING" },
    ],
    pregnancy: pregnancy(),
    ...overrides,
  };
}

describe("mapApiJourney", () => {
  it("maps stage statuses to lowercase, defaulting unknown to 'upcoming'", () => {
    const j = mapApiJourney(journey());
    expect(j.stages.map((s) => s.status)).toEqual(["done", "current", "upcoming"]);
  });

  it("renames journey fields onto the view model", () => {
    const j = mapApiJourney(journey());
    expect(j.id).toBe("j1");
    expect(j.carePathCode).toBe("OBGYN_PREGNANCY");
    expect(j.label).toBe("Pregnancy");
    expect(j.startedAt).toBe("2026-01-01T00:00:00.000Z");
  });

  it("maps pregnancy details when present", () => {
    const j = mapApiJourney(journey());
    expect(j.pregnancy).toEqual({
      weeks: 24,
      days: 3,
      dueDate: "2026-10-01T00:00:00.000Z",
      fetusCount: 1,
      pregnancyType: "singleton",
      fetalSexes: "Girl",
      riskLevel: "low",
    });
  });

  it("omits pregnancy when the care path has none", () => {
    expect(mapApiJourney(journey({ pregnancy: null })).pregnancy).toBeUndefined();
  });

  it("coerces nullish optional pregnancy fields to undefined", () => {
    const j = mapApiJourney(
      journey({
        pregnancy: pregnancy({ estimated_due_date: null, risk_level: null }),
      }),
    );
    expect(j.pregnancy?.dueDate).toBeUndefined();
    expect(j.pregnancy?.riskLevel).toBeUndefined();
  });

  it("coerces nullish journey metadata to undefined", () => {
    const j = mapApiJourney(
      journey({ care_path_code: null, specialty_code: null, label: null }),
    );
    expect(j.carePathCode).toBeUndefined();
    expect(j.specialtyCode).toBeUndefined();
    expect(j.label).toBeUndefined();
  });
});
