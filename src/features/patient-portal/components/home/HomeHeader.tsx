"use client";

import { useTranslations } from "next-intl";

import { useActiveProfile } from "../../hooks/usePatientProfiles";

/**
 * Home greeting: "Hello, {full name}" with a care subline. The notification
 * bell + profile switcher deliberately live only in the global patient navbar,
 * so they are not repeated here.
 */
export function HomeHeader() {
  const t = useTranslations("patientPortal");
  const profile = useActiveProfile();
  const name = profile?.fullName ?? "";

  return (
    <header className="min-w-0">
      <p className="text-sm text-gray-500">{t("home.hello")}</p>
      <h1 className="truncate text-2xl font-bold text-brand-black">{name}</h1>
      <p className="mt-1 text-sm text-gray-500">{t("home.careSubtitle")}</p>
    </header>
  );
}
