"use client";

import { useSearchParams } from "next/navigation";
import type { ChangeEvent } from "react";
import { getLocaleDirection } from "@/i18n/LocaleDocumentSync";
import { usePathname, useRouter } from "@/i18n/navigation";
import type { Locale } from "@/i18n/routing";

type Props = {
  currentLocale: Locale;
};

const languages: Array<{ value: Locale; label: string }> = [
  { value: "en", label: "En" },
  { value: "ar", label: "ع" },
];

export default function LanguageSelect({ currentLocale }: Props) {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();

  function handleChange(event: ChangeEvent<HTMLSelectElement>) {
    const nextLocale = event.target.value as Locale;

    if (nextLocale === currentLocale) {
      return;
    }

    const queryString = searchParams.toString();
    const href = queryString ? `${pathname}?${queryString}` : pathname;

    document.documentElement.lang = nextLocale;
    document.documentElement.dir = getLocaleDirection(nextLocale);
    router.replace(href, { locale: nextLocale });
  }

  return (
    <select
      aria-label="Change language"
      className="cursor-pointer rounded border border-gray-200 bg-white px-2 py-1 text-xs text-black transition-colors hover:border-gray-400 focus:border-gray-500 focus:outline-none"
      value={currentLocale}
      onChange={handleChange}
    >
      {languages.map((language) => (
        <option key={language.value} value={language.value}>
          {language.label}
        </option>
      ))}
    </select>
  );
}
