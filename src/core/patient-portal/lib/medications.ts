/**
 * Presentation helpers for patient-portal medications.
 *
 * Pure (no React/i18n) so the screen component stays thin and a future real-data
 * layer can reuse the same icon/duration mapping. Strings that need translation
 * are resolved in the component via `useTranslations`.
 */
import { Droplet, Pill, Syringe, type LucideIcon } from "lucide-react";

import type {
  MedicationForm,
  PortalMedication,
  PortalPrescription,
} from "../types/patient-portal.types";

/** Icon shown in the card's leading chip, by dosage form. */
export const MED_FORM_ICON: Record<MedicationForm, LucideIcon> = {
  tablet: Pill,
  capsule: Pill,
  injection: Syringe,
  drops: Droplet,
  syrup: Droplet,
  other: Pill,
};

/**
 * Folds a flat list of medicines into the prescriptions they were written in,
 * keyed by `prescriptionId`. Header fields (date, doctor, clinic) are taken from
 * the first item of each group — every item in a prescription shares them. The
 * result is sorted newest-first by `prescribedAt`. Pure (no React/i18n).
 */
export function groupIntoPrescriptions(
  meds: PortalMedication[],
): PortalPrescription[] {
  const byId = new Map<string, PortalPrescription>();

  for (const med of meds) {
    const existing = byId.get(med.prescriptionId);
    if (existing) {
      existing.items.push(med);
      continue;
    }
    byId.set(med.prescriptionId, {
      id: med.prescriptionId,
      prescribedAt: med.startDate,
      doctorName: med.prescriberName,
      clinic: med.clinic,
      organizationName: med.organizationName,
      items: [med],
    });
  }

  return [...byId.values()].sort(
    (a, b) =>
      new Date(b.prescribedAt).getTime() - new Date(a.prescribedAt).getTime(),
  );
}
