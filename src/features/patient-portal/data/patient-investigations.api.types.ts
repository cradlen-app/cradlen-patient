/**
 * Wire shapes for `GET /v1/patient-portal/investigations`.
 *
 * Mirror the backend `PatientInvestigationItemDto` exactly. The portal renders
 * the `PortalTest` view model instead — see `lib/map-investigation.ts` for the
 * boundary mapping. Result fields are gated server-side on `REVIEWED`.
 */

/** A visible result file (presigned GET URL), from `result_attachments[]`. */
export interface ApiInvestigationAttachment {
  id: string;
  /** Short-lived presigned GET URL. */
  url: string;
  content_type: string | null;
  /** ISO timestamp the file was uploaded. */
  uploaded_at: string;
  /** PATIENT | CLINIC | EXTERNAL_LAB. */
  source: string;
}

export interface ApiPatientInvestigationItem {
  id: string;
  /** Catalog test name, or the free-typed test name. */
  test_name: string;
  /** LAB | IMAGING | OTHER. */
  type: "LAB" | "IMAGING" | "OTHER" | null;
  /** ORDERED | RESULTED | REVIEWED | CANCELLED. */
  status: string;
  /** ISO timestamp the investigation was ordered. */
  ordered_at: string;
  /** Instructions / notes for the patient. */
  instructions: string | null;
  /** Already formatted as "Dr. <first> <last>". */
  ordered_by_name: string | null;
  /** ISO timestamp a doctor reviewed the result, when reviewed. */
  reviewed_at: string | null;
  /** Reviewing doctor; only set once the result is REVIEWED. */
  reviewed_by_name: string | null;
  /** Result text; null until the result is REVIEWED. */
  result_text: string | null;
  /**
   * Visible result files (patient-uploaded always; clinic files when REVIEWED).
   * Optional: omitted by older API builds, so consumers must null-guard it.
   */
  result_attachments?: ApiInvestigationAttachment[];
  visit_id: string;
  /** ISO timestamp of the visit the investigation was ordered in. */
  visit_date: string;
  organization_name: string | null;
  branch_name: string | null;
}

/** Response of `POST …/result-upload-url` (wrapped in `{ data }`). */
export interface ApiResultUploadUrl {
  key: string;
  upload_url: string;
  expires_in: number;
  content_type: string;
}

export interface ApiPatientInvestigationsResponse {
  data: ApiPatientInvestigationItem[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}
