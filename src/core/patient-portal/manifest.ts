import type { Locale, ModuleManifest } from "@/common/kernel-contracts";

import { patientPortalPermissions } from "./permissions";
import { PATIENT_PORTAL_QUERY_KEY_ROOT } from "./queryKeys";

/**
 * Patient Portal module manifest.
 *
 * Like the staff manifest, this deliberately does NOT import from `./api` or
 * `./pages` — those re-export React client components that must not load during
 * kernel boot in non-DOM contexts (server `getRequestConfig`, Vitest).
 *
 * `nav` is empty: the portal navigates via its own app-shell chrome
 * (`PatientDashboardLayout` in `@/components/layout`), not the staff
 * dashboard sidebar.
 */
const patientPortalManifest: ModuleManifest = {
  id: "patient-portal",
  kind: "core",
  i18nNamespace: "patientPortal",
  loadMessages: async (locale: Locale) => {
    switch (locale) {
      case "ar":
        return (await import("./messages/ar.json")).default;
      case "en":
      default:
        return (await import("./messages/en.json")).default;
    }
  },
  nav: [],
  permissions: patientPortalPermissions,
  queryKeyRoot: PATIENT_PORTAL_QUERY_KEY_ROOT,
};

export default patientPortalManifest;
