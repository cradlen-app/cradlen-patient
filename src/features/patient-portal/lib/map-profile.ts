/**
 * Boundary mapping from the backend profile wire shape (`ApiPatientProfile`) to
 * the portal's `PatientProfileDetails` view model. Pure (no React/i18n).
 */
import type {
  MaritalStatus,
  PatientProfileDetails,
} from "../types/patient-portal.types";
import type { ApiPatientProfile } from "../data/patient-profile.api.types";

const MARITAL_STATUSES: readonly MaritalStatus[] = [
  "SINGLE",
  "MARRIED",
  "DIVORCED",
  "WIDOWED",
  "SEPARATED",
  "ENGAGED",
  "UNKNOWN",
];

/** Narrow an unknown backend status string to the known enum, else UNKNOWN. */
function toMaritalStatus(value: string): MaritalStatus {
  return (MARITAL_STATUSES as readonly string[]).includes(value)
    ? (value as MaritalStatus)
    : "UNKNOWN";
}

export function mapApiProfile(item: ApiPatientProfile): PatientProfileDetails {
  return {
    id: item.id,
    fullName: item.full_name ?? "",
    nationalId: item.national_id ?? "",
    dateOfBirth: item.date_of_birth ?? "",
    phoneNumber: item.phone_number ?? "",
    address: item.address ?? "",
    maritalStatus: toMaritalStatus(item.marital_status),
    imageUrl: item.profile_image_url ?? null,
  };
}
