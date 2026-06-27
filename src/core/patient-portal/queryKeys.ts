/**
 * Owned TanStack Query namespace for the patient-portal module.
 *
 * Keys are scoped by the active patient profile id (self or dependent) so that
 * switching profiles fetches/caches independently. The kernel verifies no other
 * module claims the `patient-portal` root key (see manifest.queryKeyRoot).
 */
export const patientPortalQueryKeys = {
  /** Broad key — matches everything for the module. */
  all: () => ["patient-portal"] as const,
  /** The authenticated patient/guardian identity from /patient-auth/me. */
  me: () => ["patient-portal", "me"] as const,
  /** The account's security-question key (child of `me`, so `me()` invalidation refreshes it). */
  securityQuestion: () =>
    ["patient-portal", "me", "security-question"] as const,
  profiles: () => ["patient-portal", "profiles"] as const,
  profileDetails: (patientId: string) =>
    ["patient-portal", "profile-details", patientId] as const,
  healthRecord: (patientId: string) =>
    ["patient-portal", "health-record", patientId] as const,
  visitHistory: (patientId: string) =>
    ["patient-portal", "visit-history", patientId] as const,
  upcomingVisits: (patientId: string) =>
    ["patient-portal", "upcoming-visits", patientId] as const,
  journeyTimeline: (patientId: string) =>
    ["patient-portal", "journey-timeline", patientId] as const,
  history: (patientId: string) =>
    ["patient-portal", "history", patientId] as const,
  journey: (patientId: string) =>
    ["patient-portal", "journey", patientId] as const,
  medications: (patientId: string) =>
    ["patient-portal", "medications", patientId] as const,
  labOrders: (patientId: string) =>
    ["patient-portal", "lab-orders", patientId] as const,
  investigations: (patientId: string, status?: string, type?: string) =>
    [
      "patient-portal",
      "investigations",
      patientId,
      status ?? "all",
      type ?? "all",
    ] as const,
  documents: (patientId: string) =>
    ["patient-portal", "documents", patientId] as const,
  appointments: (patientId: string) =>
    ["patient-portal", "appointments", patientId] as const,
  home: (patientId: string) => ["patient-portal", "home", patientId] as const,
  /** Notifications are account-wide (across the caller's accessible patients). */
  notifications: () => ["patient-portal", "notifications"] as const,
  /** The full paginated notifications list (child of `notifications`). */
  notificationsAll: () => ["patient-portal", "notifications", "all"] as const,
} as const;

/** Root key registered with the kernel's QueryKeyRegistry. */
export const PATIENT_PORTAL_QUERY_KEY_ROOT = ["patient-portal"] as const;
