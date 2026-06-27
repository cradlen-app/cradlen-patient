/**
 * Wire shapes for `GET /v1/patient-portal/visits/journeys/timeline`.
 *
 * Mirror the backend `PatientJourneyTimelineDto` / `PatientJourneyTimelineEpisodeDto`
 * exactly. Each nested visit is the same rich `ApiPatientVisitItem` returned by
 * `/patient-portal/visits`, so the portal reuses `mapApiVisit` for it. The portal
 * renders the `PortalJourneyTimelineEntry` view model — see
 * `lib/map-journey-timeline.ts` for the boundary mapping.
 */
import type { ApiPatientVisitItem } from "./patient-visits.api.types";

export interface ApiPatientJourneyTimelineEpisode {
  id: string;
  name: string;
  order: number;
  /** ACTIVE | COMPLETED | CANCELLED. */
  status: string;
  started_at: string | null;
  ended_at: string | null;
  visits: ApiPatientVisitItem[];
}

export interface ApiPatientJourneyTimelineEntry {
  id: string;
  /** Journey display name (from the journey template, e.g. "Pregnancy"). */
  name: string;
  /** Journey template type, e.g. "OBGYN_PREGNANCY". */
  type: string;
  /** ACTIVE | COMPLETED | CANCELLED. */
  status: string;
  started_at: string;
  ended_at: string | null;
  episodes: ApiPatientJourneyTimelineEpisode[];
}

export interface ApiPatientJourneyTimelineResponse {
  data: ApiPatientJourneyTimelineEntry[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}
