import { setRequestLocale } from "next-intl/server";

import { HomeScreen } from "@/core/patient-portal/pages";

type Props = { params: Promise<{ locale: string }> };

export default async function PatientHomeRoute({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  return <HomeScreen />;
}
