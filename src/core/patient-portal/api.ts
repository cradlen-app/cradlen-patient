/**
 * Patient Portal module public surface — non-page exports.
 *
 * Data/types/hooks/store consumed by app routes, tests, and (later) the
 * patient auth flow. The sibling `pages.ts` holds route-mounted UI. Keeping
 * them split means this api stays importable from non-DOM contexts.
 */

export type {
  Appointment,
  AppointmentStatus,
  Allergy,
  Clinic,
  DocumentKind,
  DocumentStatus,
  HealthRecord,
  LabCategory,
  LabOrder,
  LabOrderStatus,
  LabResult,
  PatientProfile,
  PortalDocument,
  PortalJourney,
  PortalJourneyStage,
  PortalMedication,
  PortalPregnancy,
  PortalTest,
  PortalTestReview,
  PortalTestStatus,
  PortalVisit,
  JourneyStageStatus,
  Reminder,
  UploadDocumentInput,
  UploadFile,
  VitalsPoint,
} from "./types/patient-portal.types";

export {
  usePatientProfiles,
  useActivePatientId,
  useActiveProfile,
} from "./hooks/usePatientProfiles";
export {
  useHealthRecord,
  useMedications,
  usePatientHistory,
  usePatientJourney,
  useHomeSummary,
  useInvestigations,
  useLabOrders,
  useDocuments,
  useAppointments,
  useReminders,
} from "./hooks/usePortalData";
export type { HomeSummary } from "./hooks/usePortalData";
export { useUploadDocument } from "./hooks/useUploadDocument";

export {
  usePatientProfileStore,
  DEFAULT_PROFILE_ID,
} from "./store/patientProfileStore";

export {
  patientPortalQueryKeys,
  PATIENT_PORTAL_QUERY_KEY_ROOT,
} from "./queryKeys";
