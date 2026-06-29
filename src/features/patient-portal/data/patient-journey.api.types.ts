/**
 * Wire shapes for `GET /v1/patient-portal/journey`.
 *
 * Mirror the backend `PatientJourneyDto` / `PatientJourneyStageDto` /
 * `PatientPregnancyDto` exactly. The portal renders the `PortalJourney` view
 * model instead — see `lib/map-journey.ts` for the boundary mapping. GA + EDD
 * are computed server-side, so the client does no clinical math.
 */

/** Portal-facing stage status, derived server-side from the episode lifecycle. */
export type ApiJourneyStageStatus = "DONE" | "CURRENT" | "UPCOMING";

export interface ApiPatientJourneyStage {
  id: string;
  name: string;
  order: number;
  status: ApiJourneyStageStatus;
}

export interface ApiPatientPregnancy {
  /** Current gestational age (whole weeks) as of now, or null with no dating anchor. */
  gestational_age_weeks: number | null;
  /** Remaining days of the current gestational week (0–6), or null. */
  gestational_age_days: number | null;
  /** Estimated due date (ISO timestamp), or null with no dating anchor. */
  estimated_due_date: string | null;
  number_of_fetuses: number | null;
  /** Free-text, e.g. "singleton" | "twin" | "multiple". */
  pregnancy_type: string | null;
  /** Free-text fetal sex(es) as recorded by the clinic, e.g. "Boy & Girl". */
  fetal_sexes: string | null;
  risk_level: string | null;
}

export interface ApiPatientJourney {
  journey_id: string;
  /** Care-path discriminator, e.g. "OBGYN_PREGNANCY"; null when none assigned. */
  care_path_code: string | null;
  specialty_code: string | null;
  /** Care-path display name, e.g. "Pregnancy". */
  label: string | null;
  status: string;
  started_at: string;
  stages: ApiPatientJourneyStage[];
  /** Present only for pregnancy care paths; null otherwise. */
  pregnancy: ApiPatientPregnancy | null;
}

/** The endpoint returns the single active journey, or null when none. */
export interface ApiPatientJourneyResponse {
  data: ApiPatientJourney | null;
}
