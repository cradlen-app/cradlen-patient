"use client";

import { useEffect } from "react";
import type { Locale } from "./routing";

type Props = {
  locale: Locale;
};

export function getLocaleDirection(locale: Locale) {
  return locale === "ar" ? "rtl" : "ltr";
}

export default function LocaleDocumentSync({ locale }: Props) {
  useEffect(() => {
    document.documentElement.lang = locale;
    document.documentElement.dir = getLocaleDirection(locale);
  }, [locale]);

  return null;
}
