/**
 * Boundary mapping from the backend journey wire shape (`ApiPatientJourney`) to
 * the portal's `PortalJourney` view model.
 *
 * Pure (no React/i18n). GA + EDD arrive already computed from the backend, so
 * this only renames fields and narrows the tri-state status to lowercase.
 */
import type {
  JourneyStageStatus,
  PortalJourney,
  PortalJourneyStage,
  PortalPregnancy,
} from "../types/patient-portal.types";
import type {
  ApiJourneyStageStatus,
  ApiPatientJourney,
  ApiPatientPregnancy,
} from "../data/patient-journey.api.types";

function mapStageStatus(status: ApiJourneyStageStatus): JourneyStageStatus {
  switch (status) {
    case "DONE":
      return "done";
    case "CURRENT":
      return "current";
    default:
      return "upcoming";
  }
}

function mapPregnancy(p: ApiPatientPregnancy): PortalPregnancy {
  return {
    weeks: p.gestational_age_weeks,
    days: p.gestational_age_days,
    dueDate: p.estimated_due_date ?? undefined,
    fetusCount: p.number_of_fetuses ?? undefined,
    pregnancyType: p.pregnancy_type ?? undefined,
    fetalSexes: p.fetal_sexes ?? undefined,
    riskLevel: p.risk_level ?? undefined,
  };
}

export function mapApiJourney(item: ApiPatientJourney): PortalJourney {
  const stages: PortalJourneyStage[] = item.stages.map((s) => ({
    id: s.id,
    name: s.name,
    order: s.order,
    status: mapStageStatus(s.status),
  }));

  return {
    id: item.journey_id,
    carePathCode: item.care_path_code ?? undefined,
    specialtyCode: item.specialty_code ?? undefined,
    label: item.label ?? undefined,
    status: item.status,
    startedAt: item.started_at,
    stages,
    pregnancy: item.pregnancy ? mapPregnancy(item.pregnancy) : undefined,
  };
}
