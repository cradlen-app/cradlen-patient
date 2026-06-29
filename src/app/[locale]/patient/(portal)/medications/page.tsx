import { setRequestLocale } from "next-intl/server";

import { MedicationsScreen } from "@/features/patient-portal/pages";

type Props = { params: Promise<{ locale: string }> };

export default async function PatientMedicationsRoute({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  return <MedicationsScreen />;
}
