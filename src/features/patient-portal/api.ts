/**
 * Patient Portal module public surface — non-page exports.
 *
 * Data/types/hooks/store consumed by app routes, tests, and (later) the
 * patient auth flow. The sibling `pages.ts` holds route-mounted UI. Keeping
 * them split means this api stays importable from non-DOM contexts.
 */

export type {
  Clinic,
  LabCategory,
  PatientProfile,
  PortalJourney,
  PortalJourneyStage,
  PortalMedication,
  PortalPregnancy,
  PortalTest,
  PortalTestReview,
  PortalTestStatus,
  PortalVisit,
  JourneyStageStatus,
} from "./types/patient-portal.types";

export {
  usePatientProfiles,
  useActivePatientId,
  useActiveProfile,
} from "./hooks/usePatientProfiles";
export {
  useMedications,
  usePatientHistory,
  usePatientJourney,
  useHomeSummary,
  useInvestigations,
} from "./hooks/usePortalData";
export type { HomeSummary } from "./hooks/usePortalData";

export {
  usePatientProfileStore,
  DEFAULT_PROFILE_ID,
} from "./store/patientProfileStore";

export { patientPortalQueryKeys } from "./queryKeys";
