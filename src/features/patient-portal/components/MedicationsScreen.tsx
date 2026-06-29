"use client";

import { useMemo } from "react";
import { CalendarDays, Stethoscope } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";

import { formatDate } from "../lib/format";
import { groupIntoPrescriptions, MED_FORM_ICON } from "../lib/medications";
import { useMedications } from "../hooks/usePortalData";
import type {
  PortalMedication,
  PortalPrescription,
} from "../types/patient-portal.types";
import { EmptyState, ScreenHeader } from "./portal-ui";

export function MedicationsScreen() {
  const t = useTranslations("patientPortal");
  const { data: meds, isLoading } = useMedications();

  const prescriptions = useMemo(
    () => groupIntoPrescriptions(meds ?? []),
    [meds],
  );

  return (
    <div className="space-y-4 pb-24 lg:pb-0">
      <ScreenHeader title={t("medications.title")} />

      {isLoading ? (
        <EmptyState message={t("common.loading")} />
      ) : prescriptions.length === 0 ? (
        <EmptyState message={t("medications.none")} />
      ) : (
        <div className="space-y-4">
          {prescriptions.map((rx) => (
            <PrescriptionCard key={rx.id} prescription={rx} />
          ))}
        </div>
      )}
    </div>
  );
}

/** One prescription: a dated header (doctor/clinic) plus the medicines inside it. */
function PrescriptionCard({
  prescription,
}: {
  prescription: PortalPrescription;
}) {
  const t = useTranslations("patientPortal");
  const locale = useLocale();

  const clinicLabel =
    prescription.organizationName ?? prescription.clinic.name;

  return (
    <section className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
      <header className="flex flex-wrap items-start justify-between gap-2 border-b border-gray-100 pb-3">
        <div className="min-w-0">
          <p className="flex items-center gap-1.5 text-xs font-semibold text-brand-primary">
            <CalendarDays className="size-3.5 shrink-0" />
            {t("medications.prescribedOn", {
              date: formatDate(prescription.prescribedAt, locale),
            })}
          </p>
          {prescription.doctorName && (
            <p className="mt-1 flex items-center gap-1.5 text-xs text-gray-500">
              <Stethoscope className="size-3.5 shrink-0" />
              <span className="truncate">{prescription.doctorName}</span>
            </p>
          )}
        </div>
        {clinicLabel && (
          <span className="shrink-0 rounded-full bg-brand-secondary/10 px-2 py-0.5 text-[11px] font-medium text-brand-primary">
            {clinicLabel}
          </span>
        )}
      </header>

      <ul className="mt-3 flex flex-col gap-2">
        {prescription.items.map((med) => (
          <MedicineRow key={med.id} med={med} />
        ))}
      </ul>
    </section>
  );
}

/** A single medicine within a prescription card. */
function MedicineRow({ med }: { med: PortalMedication }) {
  const t = useTranslations("patientPortal");

  const Icon = MED_FORM_ICON[med.form ?? "other"];

  return (
    <li className="flex flex-col rounded-xl border border-gray-100 bg-white p-3">
      <div className="flex items-start justify-between gap-2">
        <div className="flex min-w-0 items-center gap-2">
          <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-brand-secondary/10 text-brand-primary">
            <Icon className="size-4" />
          </span>
          <p className="truncate text-sm font-semibold text-brand-black">
            {med.name}
          </p>
        </div>
        {med.category && (
          <span className="shrink-0 rounded-full bg-brand-secondary/10 px-2 py-0.5 text-[11px] font-medium text-brand-primary">
            {med.category}
          </span>
        )}
      </div>

      <div className="mt-2 flex flex-col gap-1">
        <DetailRow label={t("medications.frequency")} value={med.frequency} />
        {med.route && (
          <DetailRow label={t("medications.route")} value={med.route} />
        )}
        {med.instructions && (
          <DetailRow
            label={t("medications.instructions")}
            value={med.instructions}
          />
        )}
      </div>
    </li>
  );
}

/** A single labeled detail row inside a medicine row. */
function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-3 text-xs">
      <span className="shrink-0 text-gray-400">{label}</span>
      <span className="text-end font-medium text-gray-700">{value}</span>
    </div>
  );
}
