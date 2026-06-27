/**
 * Centralized TanStack Query key factory.
 *
 * All query keys live here so cache invalidation is consistent across the app.
 * Use these helpers everywhere instead of inline string arrays.
 */
export const queryKeys = {
  // ── Auth ──────────────────────────────────────────────────────────────────
  currentUser: () => ["currentUser"] as const,
  registrationStatus: (email: string) => ["registration-status", email] as const,

  // ── Visits ────────────────────────────────────────────────────────────────
  visits: {
    /** Broad key — matches all visit queries for any branch. */
    all: () => ["visits"] as const,
    /** Branch-level key — matches all visit queries for a given branch. */
    branch: (branchId: string) => ["visits", branchId] as const,
    schedule: (branchId: string, date: string, assignedToMe: boolean) =>
      ["visits", branchId, "schedule", date, assignedToMe] as const,
    stats: (branchId: string, date: string, assignedToMe: boolean) =>
      ["visits", branchId, "stats", date, assignedToMe] as const,
    /**
     * Monthly visit analytics. `scope` = "org" (owner) or the branch id;
     * `mine` narrows to the current doctor's own visits.
     */
    monthlyStats: (scope: string, mine = false) =>
      ["visits", scope, "monthly-stats", mine] as const,
    branchWaitingList: (
      branchId: string,
      opts: { page: number; limit: number },
    ) => ["visits", branchId, "waiting-list", opts] as const,
    branchInProgress: (branchId: string) =>
      ["visits", "v2", branchId, "in-progress"] as const,
    myWaitingList: (branchId: string, opts: { page: number; limit: number }) =>
      ["visits", branchId, "my-waiting-list", opts] as const,
    myCurrent: (branchId: string) =>
      ["visits", branchId, "my-current"] as const,
    byId: (visitId: string) => ["visits", "detail", visitId] as const,
    /** Printable prescription aggregate + resolved layout for a visit. */
    prescriptionPrint: (visitId: string) =>
      ["visits", "prescription-print", visitId] as const,
    patientHistory: (patientId: string, excludeVisitId: string) =>
      ["visits", "patient-history", patientId, excludeVisitId] as const,
    journeyTimeline: (patientId: string, excludeVisitId: string) =>
      ["visits", "journey-timeline", patientId, excludeVisitId] as const,
    vitalsTrend: (patientId: string, excludeVisitId: string) =>
      ["visits", "vitals-trend", patientId, excludeVisitId] as const,
  },

  // ── Medical-rep visits ────────────────────────────────────────────────────
  medicalRepVisits: {
    /** Broad key — matches all medical-rep visit queries. */
    all: () => ["medical-rep-visits"] as const,
    branch: (branchId: string) =>
      ["medical-rep-visits", branchId] as const,
    branchWaitingList: (
      branchId: string,
      opts: { page: number; limit: number },
    ) => ["medical-rep-visits", branchId, "waiting-list", opts] as const,
    branchInProgress: (branchId: string) =>
      ["medical-rep-visits", branchId, "in-progress"] as const,
    myWaitingList: (branchId: string, opts: { page: number; limit: number }) =>
      ["medical-rep-visits", branchId, "my-waiting-list", opts] as const,
    myCurrent: (branchId: string) =>
      ["medical-rep-visits", branchId, "my-current"] as const,
    byId: (visitId: string) =>
      ["medical-rep-visits", "detail", visitId] as const,
  },

  // Staff namespace moved to its owning module — see `@/core/staff/api`
  // (`staffQueryKeys`). The kernel's QueryKeyRegistry enforces uniqueness.

  // ── Patients ──────────────────────────────────────────────────────────────
  patients: {
    list: (
      branchId: string,
      opts: { search?: string; journeyStatus?: string; mine?: boolean },
    ) =>
      [
        "patients",
        branchId,
        opts.search,
        opts.journeyStatus,
        opts.mine ?? false,
      ] as const,
    /**
     * Analytics cards. `scope` = "org" (owner) or the branch id; `mine`
     * narrows to the current doctor's own patients.
     */
    stats: (scope: string, mine = false) =>
      ["patients", scope, "stats", mine] as const,
    search: (query: string) => ["patients", "search", query] as const,
    byId: (id: string) => ["patients", "byId", id] as const,
  },

  // ── Notifications ─────────────────────────────────────────────────────────
  notifications: {
    /** Broad key — matches all notification queries. */
    all: () => ["notifications"] as const,
    list: (opts: { page: number; limit: number; category?: string }) =>
      ["notifications", opts] as const,
  },

  // ── Investigations (doctor review) ────────────────────────────────────────
  investigations: {
    /** Broad key — matches all investigation queries. */
    all: () => ["investigations"] as const,
    review: (id: string) => ["investigations", "review", id] as const,
    /** Patient's investigations that carry result files (Overview attachments). */
    patientAttachments: (patientId: string) =>
      ["investigations", "patient-attachments", patientId] as const,
  },

  // ── Calendar ──────────────────────────────────────────────────────────────
  calendar: {
    /** Broad key — matches all calendar queries. */
    all: () => ["calendar"] as const,
    events: (
      branchId: string | undefined,
      from: string,
      to: string,
      profileId?: string,
    ) => ["calendar", "events", branchId, from, to, profileId ?? null] as const,
  },

  // ── Settings ──────────────────────────────────────────────────────────────
  settings: {
    branches: (organizationId: string) => ["branches", organizationId] as const,
  },

  // ── Organizations ─────────────────────────────────────────────────────────
  organizations: {
    specialties: (organizationId: string) =>
      ["organizations", organizationId, "specialties"] as const,
  },

  // ── Subscription (org plan + manual payments) ─────────────────────────────
  subscription: {
    current: (organizationId: string) =>
      ["subscription", organizationId, "current"] as const,
    plans: () => ["subscription", "plans"] as const,
    addOns: (organizationId: string) =>
      ["subscription", organizationId, "add-ons"] as const,
    payments: (organizationId: string, opts?: { status?: string }) =>
      ["subscription", organizationId, "payments", opts ?? {}] as const,
    payment: (organizationId: string, paymentId: string) =>
      ["subscription", organizationId, "payment", paymentId] as const,
  },

  // ── Form templates ────────────────────────────────────────────────────────
  formTemplates: {
    byCode: (code: string, extension?: string | null, locale?: string) =>
      ["form-templates", code, extension ?? null, locale ?? null] as const,
  },

  // ── OB/GYN history summary ────────────────────────────────────────────────
  obgynSummary: {
    byPatient: (patientId: string) =>
      ["obgyn-history-summary", patientId] as const,
  },

  // ── Active journey summary (Overview "Current journey" card) ───────────────
  journeySummary: {
    byPatient: (patientId: string) =>
      ["active-journey-summary", patientId] as const,
  },

  // ── Lookups ───────────────────────────────────────────────────────────────
  // Seeded reference data — long staleTime in the consuming hook.
  lookups: {
    specialties: () => ["lookups", "specialties"] as const,
    jobFunctions: () => ["lookups", "job-functions"] as const,
    profile: () => ["lookups", "profile"] as const,
  },

  // Financial namespace moved to its owning module — see
  // `@/core/financial/api` (`financialQueryKeys`). The kernel's
  // QueryKeyRegistry enforces uniqueness of the `financial` root key.
} as const;
