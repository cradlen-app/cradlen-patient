import { setRequestLocale } from "next-intl/server";

import { RecordScreen } from "@/features/patient-portal/pages";

type Props = { params: Promise<{ locale: string }> };

export default async function PatientRecordRoute({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  return <RecordScreen />;
}
