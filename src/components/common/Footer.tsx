"use client";

import { useLocale, useTranslations } from "next-intl";
import type { Locale } from "@/i18n/routing";
import LanguageSelect from "./LanguageSelect";

const MARKETING_BASE = "https://www.cradlen.com";

export default function Footer() {
  const locale = useLocale();
  const t = useTranslations("auth.signUp");
  const tg = useTranslations("userGuide");

  return (
    <footer className="border-t border-gray-200 bg-inherit px-6 py-4 md:px-8">
      <div className="flex flex-col items-center gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-xs text-gray-500">© {t("copyright")}</p>
        <nav className="flex flex-wrap items-center gap-x-3 gap-y-2">
          <a
            href={`${MARKETING_BASE}/${locale}/terms-of-service`}
            className="text-sm text-gray-500 transition-colors hover:text-brand-primary"
          >
            {t("termsOfService")}
          </a>
          <a
            href={`${MARKETING_BASE}/${locale}/privacy-policy`}
            className="text-sm text-gray-500 transition-colors hover:text-brand-primary"
          >
            {t("privacyPolicy")}
          </a>
          <a
            href={`${MARKETING_BASE}/${locale}/guide`}
            className="text-sm text-gray-500 transition-colors hover:text-brand-primary"
          >
            {tg("navLabel")}
          </a>
          <a
            href={`${MARKETING_BASE}/${locale}/help-center`}
            className="text-sm text-gray-500 transition-colors hover:text-brand-primary"
          >
            {t("helpCenter")}
          </a>
          <LanguageSelect currentLocale={locale as Locale} />
        </nav>
      </div>
    </footer>
  );
}
