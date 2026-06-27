/**
 * Boundary mapping from the backend upcoming-visit wire shape
 * (`ApiPatientUpcomingVisitItem`) to the portal's `PortalUpcomingVisit` view
 * model. Mirrors `map-visit.ts`. Pure (no React/i18n).
 */
import type { PortalUpcomingVisit } from "../types/patient-portal.types";
import type { ApiPatientUpcomingVisitItem } from "../data/patient-visits.api.types";

export function mapApiUpcomingVisit(
  item: ApiPatientUpcomingVisitItem,
): PortalUpcomingVisit {
  const branchName = item.branch_name ?? "";

  return {
    id: item.id,
    date: item.follow_up_date,
    clinic: { id: branchName, name: branchName },
    doctorName: item.doctor_name ?? "",
    specialty: item.specialty_code ?? "",
    organizationName: item.organization_name ?? undefined,
    note: item.follow_up_notes ?? undefined,
  };
}
