export type BackendUserRole = "OWNER" | "BRANCH_MANAGER" | "STAFF";

export type UserRole = "owner" | "branch_manager" | "reception" | "doctor" | "accountant" | "patient" | "unknown";

export type ExecutiveTitle = "CEO" | "COO" | "CFO" | "CMO";

export type EngagementType =
  | "FULL_TIME"
  | "PART_TIME"
  | "ON_DEMAND"
  | "EXTERNAL_CONSULTANT";

export type UserBranch = {
  id: string;
  branch_id?: string;
  name?: string;
  address: string;
  city: string;
  country?: string;
  governorate: string;
  is_main: boolean;
};

export type UserProfileRole = {
  id: string;
  name: BackendUserRole | string;
};

export type UserSpecialty = {
  id: string;
  code: string;
  name: string;
};

export type UserSubspecialty = {
  id: string;
  code: string;
  name: string;
  /** Parent specialty code. */
  specialty_code: string;
};

export type UserJobFunction = {
  id: string;
  code: string;
  name: string;
  is_clinical: boolean;
};

export type UserProfile = {
  staff_id: string;
  job_title?: string;
  executive_title?: ExecutiveTitle | null;
  /** Free-text professional title (e.g. "استشاري النساء والتوليد"). Display only. */
  professional_title?: string | null;
  engagement_type?: EngagementType | null;
  phone_number?: string | null;
  phone?: string | null;
  /** Short-lived presigned avatar URL from /auth/me, or null when none. */
  profile_image_url?: string | null;
  /** Single role: an object ({id,name}) from /auth/me, or a code string from login/signup. */
  role: UserProfileRole | string;
  organization: {
    id: string;
    name: string;
    /** /auth/me returns full specialty objects; login/signup may return strings */
    specialties?: (UserSpecialty | string)[];
    /** @deprecated misspelling — backend field is `specialties`; kept for back-compat */
    specialities?: string[];
    status: string;
    /** Short-lived presigned logo URL from /auth/me, or null when none. */
    logo_image_url?: string | null;
  };
  branches: UserBranch[];
  /** Profile-level primary specialty (one per doctor), or null/absent when none. */
  specialty?: UserSpecialty | null;
  /** Profile-level subspecialties (fellowships); each belongs to `specialty`. */
  subspecialties?: UserSubspecialty[];
  /** Profile-level job function (single); `is_clinical` lives here. Null/absent when none. */
  job_function?: UserJobFunction | null;
  /** @deprecated login/signup response only — /auth/me uses staff_id */
  profile_id?: string;
  /** @deprecated login/signup response only — /auth/me uses organization.name */
  organization_name?: string;
  /** @deprecated login/signup response only — /auth/me uses organization.id */
  organization_id?: string;
  /** @deprecated not returned by /auth/me; use branches[0] */
  branch?: UserBranch;
};

export type CurrentUser = {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone?: string | null;
  phone_number?: string | null;
  /** ISO date string (yyyy-MM-dd) or null. User-level, shared across profiles. */
  date_of_birth?: string | null;
  is_active: boolean;
  verified_at: string | null;
  created_at: string;
  /**
   * /auth/me always returns the active profile only, so this array has length 1.
   * To enumerate all of a user's profiles, use the `profiles[]` from /auth/login
   * or /auth/signup/complete instead.
   */
  profiles: UserProfile[];
};
