/**
 * Real merged message catalogs for component tests, mirroring how
 * `src/i18n/request.ts` composes them at runtime: base messages plus the
 * patient-portal module's own keys exposed under the `patientPortal` namespace.
 *
 * Using the real JSON (rather than hand-stubbed keys) keeps tests honest about
 * en/ar parity and catches missing-key regressions.
 */
import enBase from "@/messages/en.json";
import arBase from "@/messages/ar.json";
import enPortal from "@/core/patient-portal/messages/en.json";
import arPortal from "@/core/patient-portal/messages/ar.json";

export type TestLocale = "en" | "ar";

export const messagesByLocale: Record<TestLocale, Record<string, unknown>> = {
  en: { ...enBase, patientPortal: enPortal },
  ar: { ...arBase, patientPortal: arPortal },
};

export function getMessages(locale: TestLocale) {
  return messagesByLocale[locale];
}
