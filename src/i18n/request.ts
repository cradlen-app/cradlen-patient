import { getRequestConfig } from "next-intl/server";

import { routing } from "./routing";

async function loadBaseMessages(locale: string) {
  switch (locale) {
    case "ar":
      return (await import("../messages/ar.json")).default;
    default:
      return (await import("../messages/en.json")).default;
  }
}

// The patient-portal feature authors its keys unwrapped; they are exposed here
// under the `patientPortal` namespace.
async function loadPatientPortalMessages(locale: string) {
  switch (locale) {
    case "ar":
      return (await import("../features/patient-portal/messages/ar.json"))
        .default;
    default:
      return (await import("../features/patient-portal/messages/en.json"))
        .default;
  }
}

export default getRequestConfig(async ({ requestLocale }) => {
  let locale = await requestLocale;
  if (!locale || !(routing.locales as readonly string[]).includes(locale)) {
    locale = routing.defaultLocale;
  }

  const base = await loadBaseMessages(locale);
  const patientPortal = await loadPatientPortalMessages(locale);

  return { locale, messages: { ...base, patientPortal } };
});
