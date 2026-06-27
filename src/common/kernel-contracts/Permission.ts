import type { AuthContext } from "./AuthContext";

/**
 * A permission id, formatted as `<module>.<verb>`.
 * Example: `"staff.read"`, `"staff.manage"`, `"visits.cancel"`.
 */
export type PermissionId = string;

/**
 * Pure predicate evaluating an AuthContext.
 * Must be side-effect free and synchronous.
 */
export type PermissionPredicate = (ctx: AuthContext) => boolean;
