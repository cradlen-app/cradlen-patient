import { describe, expect, it } from "vitest";
import { mapApiUpcomingVisit } from "./map-upcoming-visit";
import type { ApiPatientUpcomingVisitItem } from "../data/patient-visits.api.types";

function upcoming(
  overrides: Partial<ApiPatientUpcomingVisitItem> = {},
): ApiPatientUpcomingVisitItem {
  return {
    id: "u1",
    follow_up_date: "2026-07-15T09:00:00.000Z",
    follow_up_notes: "Bring previous labs",
    source_visit_date: "2026-06-01T09:00:00.000Z",
    specialty_code: "OBGYN",
    doctor_name: "Dr. Jane Doe",
    organization_name: "Cradlen Clinic",
    branch_name: "Maadi Branch",
    ...overrides,
  };
}

describe("mapApiUpcomingVisit", () => {
  it("maps the follow-up date and core fields", () => {
    const v = mapApiUpcomingVisit(upcoming());
    expect(v.id).toBe("u1");
    expect(v.date).toBe("2026-07-15T09:00:00.000Z");
    expect(v.clinic).toEqual({ id: "Maadi Branch", name: "Maadi Branch" });
    expect(v.doctorName).toBe("Dr. Jane Doe");
    expect(v.note).toBe("Bring previous labs");
  });

  it("defaults nullish doctor/specialty/org/note and an empty branch", () => {
    const v = mapApiUpcomingVisit(
      upcoming({
        doctor_name: null,
        specialty_code: null,
        organization_name: null,
        follow_up_notes: null,
        branch_name: null,
      }),
    );
    expect(v.doctorName).toBe("");
    expect(v.specialty).toBe("");
    expect(v.organizationName).toBeUndefined();
    expect(v.note).toBeUndefined();
    expect(v.clinic).toEqual({ id: "", name: "" });
  });
});
