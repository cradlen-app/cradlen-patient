/**
 * Boundary mapping from the backend investigation wire shape
 * (`ApiPatientInvestigationItem`) to the portal's `PortalTest` view model.
 *
 * Pure (no React/i18n). The backend already gates visibility (it only sends
 * `result_attachments` / `result_text` the patient may see), so this mapper
 * trusts those fields rather than re-gating. The clinician `review` block is
 * surfaced only for `REVIEWED` rows (reviewer/date are review-only fields).
 */
import type {
  LabCategory,
  PortalTest,
} from "../types/patient-portal.types";
import type { ApiPatientInvestigationItem } from "../data/patient-investigations.api.types";

/** Backend `LabTestCategory` (LAB | IMAGING | OTHER) → the card's label key. */
function mapCategory(type: ApiPatientInvestigationItem["type"]): LabCategory {
  switch (type) {
    case "LAB":
      return "lab";
    case "IMAGING":
      return "imaging";
    default:
      return "other";
  }
}

export function mapApiInvestigation(
  item: ApiPatientInvestigationItem,
): PortalTest {
  const reviewed = item.status === "REVIEWED";
  const branchName = item.branch_name ?? "";

  return {
    id: item.id,
    name: item.test_name,
    date: item.ordered_at,
    doctorName: item.ordered_by_name ?? "",
    category: mapCategory(item.type),
    notes: item.instructions ?? undefined,
    status: reviewed ? "reviewed" : "pending",
    clinic: { id: branchName, name: branchName },
    organizationName: item.organization_name ?? undefined,
    results: (item.result_attachments ?? []).map((a) => ({
      id: a.id,
      url: a.url,
      contentType: a.content_type ?? undefined,
      source: a.source,
    })),
    review: reviewed
      ? {
          date: item.reviewed_at ?? item.ordered_at,
          notes: item.result_text ?? undefined,
          reviewerName: item.reviewed_by_name ?? undefined,
        }
      : undefined,
  };
}
