import { NextIntlClientProvider } from "next-intl";
import { getMessages, setRequestLocale } from "next-intl/server";
import LocaleDocumentSync from "@/i18n/LocaleDocumentSync";
import { routing, type Locale } from "@/i18n/routing";
import { Providers } from "@/components/Providers";

type Props = {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
};

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export default async function LocaleLayout({ children, params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const messages = await getMessages();
  const currentLocale = locale as Locale;

  return (
    <NextIntlClientProvider messages={messages}>
      <Providers>
        <LocaleDocumentSync locale={currentLocale} />
        {children}
      </Providers>
    </NextIntlClientProvider>
  );
}
