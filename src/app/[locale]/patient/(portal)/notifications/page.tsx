import { setRequestLocale } from "next-intl/server";

import { NotificationsScreen } from "@/features/patient-portal/pages";

type Props = { params: Promise<{ locale: string }> };

export default async function PatientNotificationsRoute({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  return <NotificationsScreen />;
}
