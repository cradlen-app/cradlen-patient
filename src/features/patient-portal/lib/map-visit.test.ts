import { describe, expect, it } from "vitest";
import { mapApiVisit } from "./map-visit";
import type { ApiPatientVisitItem } from "../data/patient-visits.api.types";

function apiVisit(overrides: Partial<ApiPatientVisitItem> = {}): ApiPatientVisitItem {
  return {
    id: "v1",
    visit_date: "2026-06-01T09:00:00.000Z",
    completed_at: "2026-06-02T10:00:00.000Z",
    appointment_type: "VISIT",
    priority: "NORMAL",
    status: "COMPLETED",
    specialty_code: "OBGYN",
    doctor_name: "Dr. Jane Doe",
    organization_name: "Cradlen Clinic",
    branch_name: "Maadi Branch",
    diagnoses: [],
    medications: [],
    investigations: [],
    ...overrides,
  };
}

describe("mapApiVisit", () => {
  it("maps the COMPLETED status and prefers completed_at as the date", () => {
    const v = mapApiVisit(apiVisit());
    expect(v.status).toBe("completed");
    expect(v.date).toBe("2026-06-02T10:00:00.000Z");
  });

  it("falls back to visit_date when completed_at is empty", () => {
    const v = mapApiVisit(apiVisit({ completed_at: "" }));
    expect(v.date).toBe("2026-06-01T09:00:00.000Z");
  });

  it("maps unknown statuses to 'scheduled' and CANCELLED to 'cancelled'", () => {
    expect(mapApiVisit(apiVisit({ status: "BOOKED" })).status).toBe("scheduled");
    expect(mapApiVisit(apiVisit({ status: "CANCELLED" })).status).toBe("cancelled");
  });

  it("maps EMERGENCY priority, everything else to normal", () => {
    expect(mapApiVisit(apiVisit({ priority: "EMERGENCY" })).priority).toBe("emergency");
    expect(mapApiVisit(apiVisit({ priority: "NORMAL" })).priority).toBe("normal");
  });

  it("orders the primary diagnosis first and joins descriptions", () => {
    const v = mapApiVisit(
      apiVisit({
        diagnoses: [
          { code: "B", description: "Secondary", is_primary: false },
          { code: "A", description: "Primary", is_primary: true },
        ],
      }),
    );
    expect(v.diagnosis).toBe("Primary, Secondary");
  });

  it("returns undefined diagnosis when there are none", () => {
    expect(mapApiVisit(apiVisit({ diagnoses: [] })).diagnosis).toBeUndefined();
  });

  it("flattens medications into 'name dose frequency' display strings", () => {
    const v = mapApiVisit(
      apiVisit({
        medications: [
          { name: "Folic Acid", dose: "5mg", frequency: "Daily", route: null, duration: null, instructions: null },
        ],
      }),
    );
    expect(v.medications).toEqual(["Folic Acid 5mg Daily"]);
  });

  it("collects investigation names and drops empty ones", () => {
    const v = mapApiVisit(
      apiVisit({
        investigations: [
          { name: "CBC", status: "RESULTED" },
          { name: "", status: "ORDERED" },
        ],
      }),
    );
    expect(v.investigations).toEqual(["CBC"]);
  });

  it("defaults nullish branch/doctor/specialty/organization", () => {
    const v = mapApiVisit(
      apiVisit({
        branch_name: null,
        doctor_name: null,
        specialty_code: null,
        organization_name: null,
      }),
    );
    expect(v.clinic).toEqual({ id: "", name: "" });
    expect(v.doctorName).toBe("");
    expect(v.specialty).toBe("");
    expect(v.organizationName).toBeUndefined();
  });
});
