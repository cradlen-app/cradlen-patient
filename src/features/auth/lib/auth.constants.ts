export const STAFF_ROLE = {
  OWNER: "owner",
  DOCTOR: "doctor",
  RECEPTION: "reception",
  UNKNOWN: "unknown",
} as const;

export type StaffRole = (typeof STAFF_ROLE)[keyof typeof STAFF_ROLE];

/**
 * Backend role taxonomy used by the staff feature against the current
 * /v1/organizations/:orgId/{staff,invitations} endpoints. Authority tier —
 * separate from JOB_FUNCTION_CODE (which is what the person actually does).
 */
export const STAFF_API_ROLE = {
  OWNER: "OWNER",
  BRANCH_MANAGER: "BRANCH_MANAGER",
  STAFF: "STAFF",
} as const;

export type StaffApiRole = (typeof STAFF_API_ROLE)[keyof typeof STAFF_API_ROLE];

/** Roles a non-OWNER may not assign. */
export const PRIVILEGED_API_ROLES: readonly StaffApiRole[] = [
  STAFF_API_ROLE.OWNER,
  STAFF_API_ROLE.BRANCH_MANAGER,
];

/**
 * JobFunction codes — the coarse operational role a staff member performs.
 * Exactly three: DOCTOR (clinical), RECEPTIONIST, ACCOUNTANT. The clinical
 * detail (OB/GYN, etc.) lives in Specialty, which drives examination templates.
 */
export const JOB_FUNCTION_CODE = {
  DOCTOR: "DOCTOR",
  RECEPTIONIST: "RECEPTIONIST",
  ACCOUNTANT: "ACCOUNTANT",
} as const;

export type JobFunctionCode = (typeof JOB_FUNCTION_CODE)[keyof typeof JOB_FUNCTION_CODE];

/** Job functions that count as clinical (drive the is_clinical flag). */
export const CLINICAL_JOB_FUNCTIONS: readonly JobFunctionCode[] = [
  JOB_FUNCTION_CODE.DOCTOR,
];

/** Job functions that count as physicians (visit doctor-picker). */
export const DOCTOR_JOB_FUNCTIONS: readonly JobFunctionCode[] = [
  JOB_FUNCTION_CODE.DOCTOR,
];

export const EXECUTIVE_TITLE = {
  CEO: "CEO",
  COO: "COO",
  CFO: "CFO",
  CMO: "CMO",
} as const;

export type ExecutiveTitleCode = (typeof EXECUTIVE_TITLE)[keyof typeof EXECUTIVE_TITLE];

/**
 * Coarse job-function picker for a person (an owner at signup, or a staff member
 * when invited / added / edited): DOCTOR maps 1:1 to the DOCTOR job function
 * (with a separately chosen Specialty driving templates); RECEPTIONIST /
 * ACCOUNTANT map to their codes; NONE = purely administrative (no job function).
 */
export const JOB_ROLE = {
  DOCTOR: "DOCTOR",
  RECEPTIONIST: "RECEPTIONIST",
  ACCOUNTANT: "ACCOUNTANT",
  NONE: "NONE",
} as const;

export type JobRoleCode = (typeof JOB_ROLE)[keyof typeof JOB_ROLE];

export const ENGAGEMENT_TYPE = {
  FULL_TIME: "FULL_TIME",
  PART_TIME: "PART_TIME",
  ON_DEMAND: "ON_DEMAND",
  EXTERNAL_CONSULTANT: "EXTERNAL_CONSULTANT",
} as const;

export type EngagementTypeCode = (typeof ENGAGEMENT_TYPE)[keyof typeof ENGAGEMENT_TYPE];

export const DEFAULT_ENGAGEMENT_TYPE: EngagementTypeCode = ENGAGEMENT_TYPE.FULL_TIME;

export const AUTH_TOKEN_COOKIE = "cradlen-auth-token";
export const AUTH_REFRESH_TOKEN_COOKIE = "cradlen-refresh-token";
export const AUTH_SELECTION_TOKEN_COOKIE = "cradlen-selection-token";
export const SIGNUP_TOKEN_COOKIE = "cradlen-signup-token";
export const RESET_TOKEN_COOKIE = "cradlen-reset-token";
// Matches the backend refresh-token JWT lifetime (JWT_REFRESH_EXPIRATION, 7d).
// setAuthCookies re-sets this cookie on every rotation, so the 7-day window
// slides on each use: active within any 7-day window = never logged out;
// 7 full days idle = clean logout (no dead-cookie 401 dance past the JWT exp).
export const AUTH_REFRESH_TOKEN_MAX_AGE = 60 * 60 * 24 * 7;
export const DEFAULT_AUTH_EXPIRES_IN = 60 * 60;
// Bootstrap value for proactive silent refresh: matches the backend access-token
// TTL (JWT_ACCESS_EXPIRATION, 15m). Only used to schedule the FIRST refresh
// before any /auth/refresh response is seen; subsequent ticks use the live
// `expires_in` returned by the refresh route. Overridable via
// NEXT_PUBLIC_ACCESS_TOKEN_TTL_SECONDS so it can track the backend without a
// code change (and so a short value can be used to verify the flow locally).
export const ACCESS_TOKEN_TTL_SECONDS =
  Number(process.env.NEXT_PUBLIC_ACCESS_TOKEN_TTL_SECONDS) || 60 * 15;
// Fraction of the access-token lifetime at which to proactively refresh, leaving
// margin for clock skew and background-tab timer throttling.
export const SILENT_REFRESH_RATIO = 0.8;
export const AUTH_SELECTION_TOKEN_MAX_AGE = 60 * 30;
export const SIGNUP_TOKEN_MAX_AGE = 60 * 10;
export const RESET_TOKEN_MAX_AGE = 60 * 30;

// Patient portal auth — a session fully separate from staff (the backend rejects
// cross-use of patient vs staff tokens), so it gets its own HttpOnly cookies.
export const PATIENT_AUTH_TOKEN_COOKIE = "cradlen-patient-token";
export const PATIENT_AUTH_REFRESH_TOKEN_COOKIE = "cradlen-patient-refresh-token";
export const PATIENT_SIGNUP_TOKEN_COOKIE = "cradlen-patient-signup-token";
export const PATIENT_SIGNUP_TOKEN_MAX_AGE = 60 * 30; // 30 min (backend expires_in 1800)
export const PATIENT_RESET_TOKEN_COOKIE = "cradlen-patient-reset-token";
export const PATIENT_RESET_TOKEN_MAX_AGE = 60 * 30; // 30 min (backend expires_in 1800)
