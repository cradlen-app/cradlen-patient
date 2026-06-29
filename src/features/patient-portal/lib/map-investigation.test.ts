import { describe, expect, it } from "vitest";
import { mapApiInvestigation } from "./map-investigation";
import type { ApiPatientInvestigationItem } from "../data/patient-investigations.api.types";

function inv(
  overrides: Partial<ApiPatientInvestigationItem> = {},
): ApiPatientInvestigationItem {
  return {
    id: "i1",
    test_name: "CBC",
    type: "LAB",
    status: "ORDERED",
    ordered_at: "2026-06-01T09:00:00.000Z",
    instructions: "Fasting required",
    ordered_by_name: "Dr. Jane Doe",
    reviewed_at: null,
    reviewed_by_name: null,
    result_text: null,
    result_attachments: [],
    visit_id: "v1",
    visit_date: "2026-06-01T09:00:00.000Z",
    organization_name: "Cradlen Clinic",
    branch_name: "Maadi Branch",
    ...overrides,
  };
}

describe("mapApiInvestigation", () => {
  it("maps category LAB/IMAGING/OTHER and null to 'other'", () => {
    expect(mapApiInvestigation(inv({ type: "LAB" })).category).toBe("lab");
    expect(mapApiInvestigation(inv({ type: "IMAGING" })).category).toBe("imaging");
    expect(mapApiInvestigation(inv({ type: "OTHER" })).category).toBe("other");
    expect(mapApiInvestigation(inv({ type: null })).category).toBe("other");
  });

  it("marks non-reviewed rows as pending with no review block", () => {
    const t = mapApiInvestigation(inv({ status: "ORDERED" }));
    expect(t.status).toBe("pending");
    expect(t.review).toBeUndefined();
  });

  it("surfaces the review block for REVIEWED rows", () => {
    const t = mapApiInvestigation(
      inv({
        status: "REVIEWED",
        reviewed_at: "2026-06-05T10:00:00.000Z",
        reviewed_by_name: "Dr. Reviewer",
        result_text: "Within normal limits",
      }),
    );
    expect(t.status).toBe("reviewed");
    expect(t.review).toEqual({
      date: "2026-06-05T10:00:00.000Z",
      notes: "Within normal limits",
      reviewerName: "Dr. Reviewer",
    });
  });

  it("falls back to ordered_at when a reviewed row lacks reviewed_at", () => {
    const t = mapApiInvestigation(
      inv({ status: "REVIEWED", reviewed_at: null }),
    );
    expect(t.review?.date).toBe("2026-06-01T09:00:00.000Z");
  });

  it("maps result attachments and coerces a null content_type to undefined", () => {
    const t = mapApiInvestigation(
      inv({
        result_attachments: [
          { id: "a1", url: "https://x/y", content_type: null, uploaded_at: "2026-06-02T00:00:00.000Z", source: "PATIENT" },
        ],
      }),
    );
    expect(t.results).toEqual([
      { id: "a1", url: "https://x/y", contentType: undefined, source: "PATIENT" },
    ]);
  });

  it("treats a missing result_attachments field as an empty list", () => {
    expect(mapApiInvestigation(inv({ result_attachments: undefined })).results).toEqual(
      [],
    );
  });

  it("defaults nullish doctor/branch/org/instructions", () => {
    const t = mapApiInvestigation(
      inv({
        ordered_by_name: null,
        branch_name: null,
        organization_name: null,
        instructions: null,
      }),
    );
    expect(t.doctorName).toBe("");
    expect(t.clinic).toEqual({ id: "", name: "" });
    expect(t.organizationName).toBeUndefined();
    expect(t.notes).toBeUndefined();
  });
});
