import type { ReactNode } from "react";
import { setRequestLocale } from "next-intl/server";

import { redirect } from "@/i18n/navigation";
import { hasPatientSessionCookies } from "@/infrastructure/auth-transport/patient-auth";
import { PatientDashboardLayout } from "@/components/layout/PatientDashboardLayout";

type Props = {
  children: ReactNode;
  params: Promise<{ locale: string }>;
};

export default async function PatientPortalLayout({ children, params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  // Server-side defense-in-depth behind the optimistic proxy gate. Read-only —
  // never refreshes here (a server component can't persist rotated cookies).
  if (!(await hasPatientSessionCookies())) {
    redirect({ href: "/patient/signin", locale });
  }

  return <PatientDashboardLayout>{children}</PatientDashboardLayout>;
}
