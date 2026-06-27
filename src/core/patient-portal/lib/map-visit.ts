/**
 * Boundary mapping from the backend visit wire shape (`ApiPatientVisitItem`) to
 * the portal's `PortalVisit` view model.
 *
 * Pure (no React/i18n). The portal visit card renders flat fields: a single
 * `diagnosis` line, `medications` as display strings, and `investigations` as
 * names — so the structured backend arrays are flattened here.
 */
import type {
  PortalVisit,
  VisitPriority,
  VisitStatus,
} from "../types/patient-portal.types";
import type { ApiPatientVisitItem } from "../data/patient-visits.api.types";

/** Backend `VisitStatus` → the portal's narrower display status. */
function mapStatus(status: string): VisitStatus {
  switch (status) {
    case "COMPLETED":
      return "completed";
    case "CANCELLED":
      return "cancelled";
    default:
      return "scheduled";
  }
}

/** Backend `VisitPriority` (NORMAL | EMERGENCY) → the card's pill value. */
function mapPriority(priority: ApiPatientVisitItem["priority"]): VisitPriority {
  return priority === "EMERGENCY" ? "emergency" : "normal";
}

/** Primary diagnosis first, then the rest, joined into one display line. */
function buildDiagnosis(
  diagnoses: ApiPatientVisitItem["diagnoses"],
): string | undefined {
  if (!diagnoses.length) return undefined;
  const ordered = [...diagnoses].sort(
    (a, b) => Number(b.is_primary) - Number(a.is_primary),
  );
  const text = ordered
    .map((d) => d.description)
    .filter(Boolean)
    .join(", ");
  return text || undefined;
}

export function mapApiVisit(item: ApiPatientVisitItem): PortalVisit {
  const branchName = item.branch_name ?? "";

  return {
    id: item.id,
    date: item.completed_at || item.visit_date,
    clinic: { id: branchName, name: branchName },
    doctorName: item.doctor_name ?? "",
    specialty: item.specialty_code ?? "",
    status: mapStatus(item.status),
    type: item.appointment_type,
    priority: mapPriority(item.priority),
    diagnosis: buildDiagnosis(item.diagnoses),
    medications: item.medications.map((m) =>
      [m.name, m.dose, m.frequency].filter(Boolean).join(" "),
    ),
    investigations: item.investigations
      .map((inv) => inv.name)
      .filter(Boolean),
    organizationName: item.organization_name ?? undefined,
  };
}
