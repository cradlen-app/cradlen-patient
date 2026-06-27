import { setRequestLocale } from "next-intl/server";

import { ProfileScreen } from "@/core/patient-portal/pages";

type Props = { params: Promise<{ locale: string }> };

export default async function PatientProfileRoute({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  return <ProfileScreen />;
}
