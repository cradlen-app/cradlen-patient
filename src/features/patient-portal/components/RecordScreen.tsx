"use client";

import { useTranslations } from "next-intl";

import { ScreenHeader } from "./portal-ui";
import { PatientHistory } from "./PatientHistory";

/**
 * Patient portal Record screen — focused on the patient's history records. The
 * visit timeline now lives on the dedicated Visits page (`/patient/visits`), so
 * this screen renders only the collapsible history groups.
 */
export function RecordScreen() {
  const t = useTranslations("patientPortal");

  return (
    <div className="flex w-full flex-col gap-4">
      <ScreenHeader title={t("record.title")} />
      <PatientHistory />
    </div>
  );
}
