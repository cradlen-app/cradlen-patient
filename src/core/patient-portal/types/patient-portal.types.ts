/**
 * Patient Portal domain types.
 *
 * These intentionally mirror the shapes of the staff-side API types
 * (`ApiPatient`, `ApiVisit` in `@/features/visits/types/visits.api.types.ts`)
 * so that swapping the mock data layer for real patient-scoped endpoints is a
 * mechanical change. Every aggregated item carries a `clinic` provenance field
 * because a patient's record is unified across all clinics they've visited.
 */

/** A clinic (org/branch) a patient has been seen at. Used for provenance tags. */
export interface Clinic {
  id: string;
  name: string;
  city?: string;
}

/**
 * A profile the logged-in account can view: either the account holder
 * themselves (`self`) or a dependent linked via guardian relationship.
 */
export interface PatientProfile {
  id: string;
  kind: "self" | "dependent";
  fullName: string;
  /** Relation to the account holder, for dependents (e.g. "Daughter"). */
  relation?: string;
  dateOfBirth?: string;
  nationalId?: string;
  /** Emoji avatar placeholder for the prototype. */
  avatar?: string;
  /** Short-lived presigned GET URL for the uploaded avatar, or null/absent. */
  imageUrl?: string | null;
  /** Blood group, e.g. "AB+". */
  bloodType?: string;
  /** Height in centimetres. */
  heightCm?: number;
}

export interface VitalsPoint {
  date: string;
  systolic?: number;
  diastolic?: number;
  weightKg?: number;
  bmi?: number;
}

export interface Allergy {
  id: string;
  substance: string;
  reaction?: string;
  severity?: "mild" | "moderate" | "severe";
}

export type VisitStatus = "completed" | "scheduled" | "cancelled";

/** Appointment type — mirrors the staff `ApiVisitHistoryEntry.appointment_type`. */
export type VisitType = "VISIT" | "FOLLOW_UP";

/** Clinical urgency, drives the colored-dot pill on the visit card. */
export type VisitPriority = "normal" | "urgent" | "emergency";

/** A past or scheduled clinical encounter, surfaced in the health record. */
export interface PortalVisit {
  id: string;
  date: string;
  clinic: Clinic;
  doctorName: string;
  specialty: string;
  reason?: string;
  diagnosis?: string;
  notes?: string;
  status: VisitStatus;
  /** Appointment type, shown as a label on the history card. */
  type?: VisitType;
  /** Clinical urgency, shown as a colored-dot pill. */
  priority?: VisitPriority;
  /** Prescribed medications, as display strings e.g. "Calcium Carbonate 500mg". */
  medications?: string[];
  /** Ordered investigations, e.g. "Complete blood count (CBC)". */
  investigations?: string[];
  /** Organization (clinic group) the visit's branch belongs to, for the tag. */
  organizationName?: string;
}

/**
 * A recommended upcoming follow-up, surfaced on the Visits page. Derived from a
 * completed visit's `follow_up_date` (not a booked appointment), so it carries
 * only the return date, the recommending doctor/clinic, and an optional note.
 */
export interface PortalUpcomingVisit {
  id: string;
  /** The recommended return date (ISO). */
  date: string;
  clinic: Clinic;
  doctorName: string;
  specialty: string;
  /** Organization (clinic group) the recommending branch belongs to, for the tag. */
  organizationName?: string;
  /** Free-text follow-up instruction from the recommending visit. */
  note?: string;
}

/** Marital status — mirrors the backend Prisma `MaritalStatus` enum. */
export type MaritalStatus =
  | "SINGLE"
  | "MARRIED"
  | "DIVORCED"
  | "WIDOWED"
  | "SEPARATED"
  | "ENGAGED"
  | "UNKNOWN";

/**
 * Editable demographics + avatar for the active patient, backing the Profile &
 * account settings screen. Sourced from `GET /patient-portal/profile`.
 */
export interface PatientProfileDetails {
  id: string;
  fullName: string;
  /** Read-only / immutable. */
  nationalId: string;
  dateOfBirth: string;
  phoneNumber: string;
  address: string;
  maritalStatus: MaritalStatus;
  /** Short-lived presigned GET URL for the avatar, or null when none. */
  imageUrl: string | null;
}

/** Patient-editable profile fields (PATCH body, all optional). */
export interface UpdatePatientProfileInput {
  fullName?: string;
  dateOfBirth?: string;
  phoneNumber?: string;
  address?: string;
  maritalStatus?: MaritalStatus;
}

export type MedicationStatus = "active" | "past";

/** Dosage form — drives the card icon and the per-dose unit label. */
export type MedicationForm =
  | "tablet"
  | "capsule"
  | "injection"
  | "drops"
  | "syrup"
  | "other";

/** When to take the medication relative to meals. */
export type FoodTiming = "before_meal" | "after_meal" | "with_food";

/** Therapeutic class, shown as a small label on the card. */
export type MedicationClass =
  | "antibiotic"
  | "antispasmodic"
  | "analgesic"
  | "supplement"
  | "vitamin";

export interface PortalMedication {
  id: string;
  /** Id of the prescription this medicine was written in (groups items). */
  prescriptionId: string;
  name: string;
  genericName?: string;
  dose: string;
  frequency: string;
  /** Administration route, e.g. "oral". */
  route?: string;
  /** Free-text usage instructions, e.g. "after meals". */
  instructions?: string;
  prescriberName: string;
  clinic: Clinic;
  /** Organization (clinic group) the prescribing branch belongs to. */
  organizationName?: string;
  startDate: string;
  endDate?: string;
  status: MedicationStatus;
  /** Remaining days in the course (active meds), for the Home preview. */
  daysLeft?: number;
  /** Therapeutic category, shown as a label, e.g. "Antibiotic" (raw backend value). */
  category?: string;
  /** Dosage form; drives the card icon and dose unit. */
  form?: MedicationForm;
  /** Units taken per dose, e.g. 1 → "1 tab". */
  amountPerDose?: number;
  /** Hours between doses, e.g. 8 → "8 h". */
  intervalHours?: number;
  /** Relation to meals. */
  foodTiming?: FoodTiming;
  /** Total course length in days; formatted as days/weeks/months. */
  courseDays?: number;
}

/** A prescription: the set of medicines a doctor wrote at one visit. */
export interface PortalPrescription {
  id: string;
  /** ISO timestamp the prescription was issued (header date, newest-first sort key). */
  prescribedAt: string;
  doctorName: string;
  clinic: Clinic;
  organizationName?: string;
  items: PortalMedication[];
}

/**
 * A test the doctor ordered during a visit. Drives the "Awaiting your results"
 * list, which is the entry point to the upload flow.
 */
export type LabOrderStatus =
  | "awaiting_upload" // doctor ordered it; patient owes a result
  | "pending_review" // patient uploaded; clinic hasn't reviewed yet
  | "result_ready" // a result is available to view
  | "completed";

export type LabCategory = "lab" | "imaging" | "other";

export interface LabOrder {
  id: string;
  name: string;
  category: LabCategory;
  orderedDate: string;
  doctorName: string;
  clinic: Clinic;
  /** The visit this order belongs to — uploads attach back to it. */
  visitId: string;
  status: LabOrderStatus;
  /** Present when a result exists (clinic-published or patient-uploaded). */
  result?: LabResult;
}

export interface LabResult {
  id: string;
  name: string;
  date: string;
  /** Display label, e.g. "Normal", "Review with doctor". */
  summary?: string;
  /** Mock file reference for view/download. */
  fileRef?: string;
}

export type UploadFileType = "pdf" | "image";

export interface UploadFile {
  id: string;
  name: string;
  sizeLabel: string;
  type: UploadFileType;
}

/**
 * A test/investigation in the patient-facing "Tests" screen. Read-only view of
 * the patient's lab/imaging orders, fed by the live `/patient-portal/
 * investigations` endpoint (see `lib/map-investigation.ts`). Carries the
 * doctor's instructions and, once reviewed, the clinician's review and a
 * viewable result attachment.
 */
export type PortalTestStatus = "pending" | "reviewed";

export interface PortalTestReview {
  /** ISO date the clinician reviewed the result. */
  date: string;
  notes?: string;
  reviewerName?: string;
}

/** A visible result file (presigned URL) attached to a test. */
export interface PortalTestResult {
  id: string;
  /** Short-lived presigned GET URL. */
  url: string;
  contentType?: string;
  /** PATIENT | CLINIC | EXTERNAL_LAB — drives whether the patient may remove it. */
  source: string;
}

export interface PortalTest {
  id: string;
  /** Display name, e.g. "CBC Test". */
  name: string;
  /** Ordered date (ISO). */
  date: string;
  doctorName: string;
  /** Drives the "Type" label, e.g. "Laboratory Test". */
  category: LabCategory;
  notes?: string;
  status: PortalTestStatus;
  /** Provenance, per module convention. */
  clinic: Clinic;
  /** Organization (clinic group) the ordering branch belongs to, for the tag. */
  organizationName?: string;
  /** Visible result files (patient-uploaded and, once reviewed, clinic files). */
  results: PortalTestResult[];
  /** Present once a clinician has reviewed the result. */
  review?: PortalTestReview;
}

export type DocumentStatus = "pending_review" | "reviewed";

export type DocumentKind = "lab_result" | "scan" | "other";

/**
 * A document the patient uploaded back to a clinic/doctor. When linked to a
 * lab order, it closes the loop on that exact investigation.
 */
export interface PortalDocument {
  id: string;
  title: string;
  kind: DocumentKind;
  files: UploadFile[];
  clinic: Clinic;
  doctorName: string;
  /** Patient (self or dependent) this document is filed under. */
  forPatientId: string;
  /** Visit the upload is attached to. */
  visitId?: string;
  /** Lab order the upload fulfills, when started from "Awaiting your results". */
  labOrderId?: string;
  uploadedAt: string;
  status: DocumentStatus;
  note?: string;
}

export type AppointmentStatus = "upcoming" | "completed" | "cancelled";

export interface Appointment {
  id: string;
  date: string;
  time?: string;
  clinic: Clinic;
  doctorName: string;
  specialty: string;
  type?: string;
  status: AppointmentStatus;
}

export interface Reminder {
  id: string;
  label: string;
  detail?: string;
}

/** Where the patient is in their active care path (journey/episode). */
export interface ActiveJourney {
  name: string;
  stage?: string;
  clinic?: Clinic;
}

/** Stepper state for one journey stage, mapped from the backend tri-state. */
export type JourneyStageStatus = "done" | "current" | "upcoming";

/** One stage of the patient's journey, shaped for the home stepper. */
export interface PortalJourneyStage {
  id: string;
  name: string;
  order: number;
  status: JourneyStageStatus;
}

/**
 * Pregnancy summary for an OB/GYN journey. GA + EDD are computed server-side, so
 * the portal only displays them. Every field is nullable — a pregnancy may be
 * recorded before a dating anchor (ultrasound or LMP) exists.
 */
export interface PortalPregnancy {
  /** Current gestational age in whole weeks, e.g. 12 → "Week 12 of 40". */
  weeks: number | null;
  /** Remaining days of the current gestational week (0–6). */
  days: number | null;
  /** Estimated due date (ISO), or undefined when no dating anchor. */
  dueDate?: string;
  /** Number of fetuses, e.g. 2 for a twin pregnancy. */
  fetusCount?: number;
  /** Raw backend type, e.g. "singleton" | "twin" | "multiple". */
  pregnancyType?: string;
  /** Free-text fetal sex(es) as recorded, e.g. "Boy & Girl". */
  fetalSexes?: string;
  /** Raw backend risk level, e.g. "high". */
  riskLevel?: string;
}

/**
 * The patient's single active journey, backing the home dashboard hero +
 * stepper. `carePathCode` lets the UI pick a hero variant (pregnancy is the
 * first concrete one); `pregnancy` is present only for pregnancy care paths.
 */
export interface PortalJourney {
  id: string;
  /** Care-path discriminator, e.g. "OBGYN_PREGNANCY"; undefined when none. */
  carePathCode?: string;
  specialtyCode?: string;
  /** Care-path display name, e.g. "Pregnancy". */
  label?: string;
  status: string;
  startedAt: string;
  stages: PortalJourneyStage[];
  pregnancy?: PortalPregnancy;
}

/**
 * One episode of a journey in the Visits-page timeline, carrying its completed
 * visits (newest first). Mirrors the staff Overview timeline's episode group.
 */
export interface PortalJourneyTimelineEpisode {
  id: string;
  name: string;
  order: number;
  /** ACTIVE | COMPLETED | CANCELLED (raw backend value). */
  status: string;
  startedAt: string | null;
  endedAt: string | null;
  visits: PortalVisit[];
}

/**
 * One journey in the Visits-page timeline: a Journey → Episode → Visit tree that
 * mirrors the staff visit-workspace history. Paginated by journey.
 */
export interface PortalJourneyTimelineEntry {
  id: string;
  /** Journey display name, e.g. "Pregnancy". */
  name: string;
  /** Journey template type, e.g. "OBGYN_PREGNANCY". */
  type: string;
  /** ACTIVE | COMPLETED | CANCELLED (raw backend value). */
  status: string;
  startedAt: string;
  endedAt: string | null;
  episodes: PortalJourneyTimelineEpisode[];
}

/** Aggregated "my health" snapshot for a single patient profile. */
export interface HealthRecord {
  patientId: string;
  visits: PortalVisit[];
  vitals: VitalsPoint[];
  allergies: Allergy[];
  activeJourney?: ActiveJourney;
}

/** Input to create a patient-uploaded document. */
export interface UploadDocumentInput {
  forPatientId: string;
  labOrderId?: string;
  visitId?: string;
  kind: DocumentKind;
  clinicId: string;
  doctorName: string;
  files: UploadFile[];
  note?: string;
}
