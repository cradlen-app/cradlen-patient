// Patient portal auth constants. The patient session is fully separate from the
// staff session (the backend rejects cross-use of patient vs staff tokens), so
// it gets its own HttpOnly cookies. This file is patient-only by design — the
// staff taxonomy/cookies that shipped in the original cradlen-web copy were
// dropped when this portal was extracted.

export const PATIENT_AUTH_TOKEN_COOKIE = "cradlen-patient-token";
export const PATIENT_AUTH_REFRESH_TOKEN_COOKIE = "cradlen-patient-refresh-token";
export const PATIENT_SIGNUP_TOKEN_COOKIE = "cradlen-patient-signup-token";
export const PATIENT_SIGNUP_TOKEN_MAX_AGE = 60 * 30; // 30 min (backend expires_in 1800)
export const PATIENT_RESET_TOKEN_COOKIE = "cradlen-patient-reset-token";
export const PATIENT_RESET_TOKEN_MAX_AGE = 60 * 30; // 30 min (backend expires_in 1800)

// Matches the backend refresh-token JWT lifetime (JWT_REFRESH_EXPIRATION, 7d).
// setPatientAuthCookies re-sets this cookie on every rotation, so the 7-day
// window slides on each use: active within any 7-day window = never logged out;
// 7 full days idle = clean logout (no dead-cookie 401 dance past the JWT exp).
export const PATIENT_AUTH_REFRESH_TOKEN_MAX_AGE = 60 * 60 * 24 * 7;

// Fallback access-token lifetime applied when the backend omits `expires_in`.
export const DEFAULT_AUTH_EXPIRES_IN = 60 * 60;
