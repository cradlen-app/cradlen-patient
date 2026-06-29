/**
 * Wire shapes for `GET /v1/patient-portal/medications`.
 *
 * Mirror the backend `PatientMedicationItemDto` / `PatientMedicationsResponseDto`
 * exactly. The portal renders the `PortalMedication` view model instead — see
 * `lib/map-medication.ts` for the boundary mapping.
 */

export interface ApiPatientMedicationItem {
  id: string;
  /** Id of the prescription this medicine belongs to (groups items together). */
  prescription_id: string;
  name: string;
  generic_name: string | null;
  strength: string | null;
  form: string | null;
  category: string | null;
  dose: string;
  frequency: string;
  duration: string | null;
  instructions: string | null;
  route: string | null;
  /** ISO timestamp of the visit the prescription was written in. */
  visit_date: string;
  /** ISO timestamp the prescription was issued. */
  prescribed_at: string;
  /** ISO timestamp the course ends, or null when open-ended/unparseable. */
  end_date: string | null;
  is_current: boolean;
  /** Already formatted as "Dr. <first> <last>". */
  doctor_name: string | null;
  /** The branch name the visit took place at. */
  clinic_name: string | null;
  /** The organization (clinic group) the branch belongs to. */
  organization_name: string | null;
}

export interface ApiPatientMedicationsResponse {
  data: {
    current: ApiPatientMedicationItem[];
    past: ApiPatientMedicationItem[];
  };
  meta: Record<string, unknown>;
}
