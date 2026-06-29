import { describe, expect, it } from "vitest";
import { mapApiJourneyTimeline } from "./map-journey-timeline";
import type { ApiPatientVisitItem } from "../data/patient-visits.api.types";
import type { ApiPatientJourneyTimelineEntry } from "../data/patient-journey-timeline.api.types";

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
    diagnoses: [{ code: "N80.0", description: "Endometriosis", is_primary: true }],
    medications: [],
    investigations: [],
    ...overrides,
  };
}

function entry(
  overrides: Partial<ApiPatientJourneyTimelineEntry> = {},
): ApiPatientJourneyTimelineEntry {
  return {
    id: "jt1",
    name: "Pregnancy",
    type: "OBGYN_PREGNANCY",
    status: "ACTIVE",
    started_at: "2026-01-01T00:00:00.000Z",
    ended_at: null,
    episodes: [
      {
        id: "e1",
        name: "First trimester",
        order: 1,
        status: "COMPLETED",
        started_at: "2026-01-01T00:00:00.000Z",
        ended_at: "2026-03-01T00:00:00.000Z",
        visits: [apiVisit()],
      },
    ],
    ...overrides,
  };
}

describe("mapApiJourneyTimeline", () => {
  it("maps the entry and its episodes", () => {
    const result = mapApiJourneyTimeline(entry());
    expect(result.id).toBe("jt1");
    expect(result.type).toBe("OBGYN_PREGNANCY");
    expect(result.episodes).toHaveLength(1);
    expect(result.episodes[0]).toMatchObject({
      id: "e1",
      name: "First trimester",
      status: "COMPLETED",
      startedAt: "2026-01-01T00:00:00.000Z",
      endedAt: "2026-03-01T00:00:00.000Z",
    });
  });

  it("maps nested visits through mapApiVisit (flattened diagnosis)", () => {
    const result = mapApiJourneyTimeline(entry());
    const visit = result.episodes[0].visits[0];
    expect(visit.diagnosis).toBe("Endometriosis");
    expect(visit.status).toBe("completed");
  });

  it("preserves a null ended_at on the entry", () => {
    expect(mapApiJourneyTimeline(entry({ ended_at: null })).endedAt).toBeNull();
  });

  it("handles an episode with no visits", () => {
    const result = mapApiJourneyTimeline(
      entry({
        episodes: [
          {
            id: "e2",
            name: "Empty",
            order: 1,
            status: "ACTIVE",
            started_at: null,
            ended_at: null,
            visits: [],
          },
        ],
      }),
    );
    expect(result.episodes[0].visits).toEqual([]);
  });
});
