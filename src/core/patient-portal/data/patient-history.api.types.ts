/**
 * Wire shapes for `GET /v1/patient-portal/obgyn-history`.
 *
 * The backend delivers history **display-ready**: a list of groups (one history
 * type each, OB/GYN today), each with collapsible sections of labeled rows. The
 * portal renders these generically (see `components/PatientHistory.tsx`) — no
 * field mapping. Mirror the backend `PortalHistory*Dto` shapes exactly.
 */

export interface ApiPortalHistoryRow {
  label: string;
  value: string;
}

export interface ApiPortalHistoryEntry {
  /** Heading for a repeatable record (e.g. a pregnancy); null for singletons. */
  title: string | null;
  rows: ApiPortalHistoryRow[];
}

export interface ApiPortalHistorySection {
  code: string;
  label: string;
  entries: ApiPortalHistoryEntry[];
}

export interface ApiPortalHistoryGroup {
  code: string;
  label: string;
  version: number | null;
  sections: ApiPortalHistorySection[];
}

export interface ApiPortalHistoryResponse {
  patient_id: string;
  groups: ApiPortalHistoryGroup[];
}
