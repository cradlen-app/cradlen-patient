import { setRequestLocale } from "next-intl/server";

import { VisitsScreen } from "@/features/patient-portal/pages";

type Props = { params: Promise<{ locale: string }> };

export default async function PatientVisitsRoute({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  return <VisitsScreen />;
}
