import { setRequestLocale } from "next-intl/server";

import { TestsScreen } from "@/features/patient-portal/pages";

type Props = { params: Promise<{ locale: string }> };

export default async function PatientTestsRoute({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  return <TestsScreen />;
}
