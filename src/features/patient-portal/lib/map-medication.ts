/**
 * Boundary mapping from the backend medications wire shape
 * (`ApiPatientMedicationItem`) to the portal's `PortalMedication` view model.
 *
 * Pure (no React/i18n). Free-text dosage strings (`dose`, `frequency`,
 * `duration`) are passed through as-is — the medication card renders
 * `dose · frequency` when the structured fields are absent, so we deliberately
 * do not parse them into `amountPerDose` / `intervalHours` / `courseDays`.
 */
import type {
  MedicationForm,
  MedicationStatus,
  PortalMedication,
} from "../types/patient-portal.types";
import type { ApiPatientMedicationItem } from "../data/patient-medications.api.types";

const FORMS: ReadonlySet<MedicationForm> = new Set([
  "tablet",
  "capsule",
  "injection",
  "drops",
  "syrup",
  "other",
]);

/** Known dosage form (lowercased), or `"other"` for an unrecognized value. */
function mapForm(form: string | null): MedicationForm | undefined {
  if (!form) return undefined;
  const key = form.trim().toLowerCase();
  return FORMS.has(key as MedicationForm) ? (key as MedicationForm) : "other";
}

const DAY_MS = 86_400_000;

/** Whole days from the start of today until `endIso`, or undefined if not future. */
function daysLeftFrom(endIso: string | null): number | undefined {
  if (!endIso) return undefined;
  const end = new Date(endIso).getTime();
  if (Number.isNaN(end)) return undefined;

  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const diff = end - todayStart.getTime();
  return diff > 0 ? Math.ceil(diff / DAY_MS) : undefined;
}

export function mapApiMedication(
  item: ApiPatientMedicationItem,
  status: MedicationStatus,
): PortalMedication {
  const clinicName = item.clinic_name ?? "";

  return {
    id: item.id,
    prescriptionId: item.prescription_id,
    name: item.name,
    genericName: item.generic_name ?? undefined,
    dose: item.dose,
    frequency: item.frequency,
    route: item.route ?? undefined,
    instructions: item.instructions ?? undefined,
    prescriberName: item.doctor_name ?? "",
    clinic: { id: clinicName, name: clinicName },
    organizationName: item.organization_name ?? undefined,
    startDate: item.visit_date,
    endDate: item.end_date ?? undefined,
    status,
    daysLeft: status === "active" ? daysLeftFrom(item.end_date) : undefined,
    category: item.category ?? undefined,
    form: mapForm(item.form),
  };
}
