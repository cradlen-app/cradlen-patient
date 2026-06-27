import {
  Home,
  ClipboardList,
  Pill,
  FlaskConical,
  Stethoscope,
  User,
  type LucideIcon,
} from "lucide-react";

/**
 * Navigation for the patient portal chrome. `path` is patient-dashboard
 * relative (`""` = home), resolved to `/patient{path}` by the shell — this
 * lets the items feed the shared `SidebarNav` (which special-cases `""` for
 * exact-match active styling). `key` is a full i18n key under the
 * `patientPortal` namespace. `primary` items also appear in the mobile tab bar.
 */
export type PatientNavItem = {
  path: string;
  key: string;
  icon: LucideIcon;
  primary: boolean;
};

export const PATIENT_NAV: readonly PatientNavItem[] = [
  { path: "", key: "patientPortal.nav.home", icon: Home, primary: true },
  {
    path: "/record",
    key: "patientPortal.nav.record",
    icon: ClipboardList,
    primary: false,
  },
  {
    path: "/visits",
    key: "patientPortal.nav.visits",
    icon: Stethoscope,
    primary: true,
  },
  {
    path: "/medications",
    key: "patientPortal.nav.medications",
    icon: Pill,
    primary: true,
  },
  {
    path: "/tests",
    key: "patientPortal.nav.tests",
    icon: FlaskConical,
    primary: true,
  },
  {
    path: "/profile",
    key: "patientPortal.nav.profile",
    icon: User,
    primary: false,
  },
] as const;

/** Resolve a patient nav `path` to an absolute route. */
export function patientHref(path: string): string {
  return path === "" ? "/patient" : `/patient${path}`;
}
