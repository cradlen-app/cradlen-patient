/**
 * Wire shapes for the patient profile/account endpoints.
 *
 * Mirror the backend `PatientProfileDto` and `ProfileImageUploadUrlDto` exactly.
 * The portal renders the camelCase `PatientProfileDetails` view model instead —
 * see `lib/map-profile.ts` for the boundary mapping.
 */

export interface ApiPatientProfile {
  id: string;
  full_name: string;
  /** Read-only / immutable — not part of the update DTO. */
  national_id: string;
  /** ISO date string. */
  date_of_birth: string;
  phone_number: string;
  address: string;
  /** SINGLE | MARRIED | DIVORCED | WIDOWED | SEPARATED | ENGAGED | UNKNOWN. */
  marital_status: string;
  /** Short-lived presigned GET URL for the avatar, or null when none. */
  profile_image_url: string | null;
}

/** Response of `POST /patient-portal/profile/image-upload-url`. */
export interface ApiProfileImageUploadUrl {
  /** Server-derived object key, echoed back on confirm. */
  key: string;
  /** Short-lived presigned PUT URL the browser uploads the bytes to. */
  upload_url: string;
  /** Seconds until `upload_url` expires. */
  expires_in: number;
  /** Content-Type header the PUT must send. */
  content_type: string;
}
