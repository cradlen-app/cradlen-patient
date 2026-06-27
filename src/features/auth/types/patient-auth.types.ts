export type PatientLoginRequest = {
  national_id: string;
  password: string;
};

export type PatientSignupStartRequest = {
  national_id: string;
  date_of_birth: string; // YYYY-MM-DD
  phone_number: string;
};

export type PatientSignupCompleteRequest = {
  password: string;
  confirm_password: string;
  security_question: string;
  security_answer: string;
};

export type PatientForgotPasswordStartRequest = {
  national_id: string;
  date_of_birth: string; // YYYY-MM-DD
  phone_number: string;
};

export type PatientForgotPasswordStartResponse = {
  data: { security_question: string; expires_in: number | null };
  meta: Record<string, unknown>;
};

export type PatientForgotPasswordCompleteRequest = {
  security_answer: string;
  password: string;
  confirm_password: string;
};

export type PatientAuthenticatedResponse = {
  data: { authenticated: boolean };
  meta: Record<string, unknown>;
};

export type PatientSignupStartResponse = {
  data: { expires_in: number | null };
  meta: Record<string, unknown>;
};

export type PatientSummary = {
  id: string;
  full_name: string;
  date_of_birth: string; // YYYY-MM-DD
  relation: string; // "SELF" or a GuardianRelation value
};

export type PatientIdentity = {
  user_id: string;
  patient_id: string | null;
  guardian_id: string | null;
  accessible_patient_ids: string[];
  display_name: string;
  /** The account's security-question key, or null if none is set. */
  security_question: string | null;
  accessible_patients: PatientSummary[];
};

export type PatientMeResponse = {
  data: PatientIdentity;
  meta: Record<string, unknown>;
};
