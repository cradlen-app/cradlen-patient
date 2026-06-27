/**
 * Shape passed to permission predicates and nav visibility filters.
 *
 * The auth feature is responsible for materializing this from its stores.
 * The kernel never imports from auth — callers pass the context in.
 *
 * `profile` is intentionally permissive (index signature) because each
 * domain module reads different fields off it (`profile.role`,
 * `profile.job_function`, etc.). Modules cast to their concrete shape
 * inside their predicates.
 */
export interface AuthContext {
  readonly user: AuthUser | null;
  readonly profile: AuthProfile | null;
  readonly orgId: string | null;
  readonly branchId: string | null;
}

export interface AuthUser {
  readonly id: string;
  readonly email?: string | null;
  readonly [key: string]: unknown;
}

export interface AuthProfile {
  /** Most concrete profiles use `staff_id` or `id`; both are accepted as opaque strings. */
  readonly id?: string;
  readonly [key: string]: unknown;
}

export type AuthRole = "owner" | "doctor" | "reception" | "unknown";
