/**
 * Owned root key for a module's TanStack Query cache namespace.
 * The kernel verifies uniqueness across all modules on registration.
 */
export type QueryKeyRoot = readonly [string, ...string[]];
