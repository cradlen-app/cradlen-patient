/**
 * Shared render helper for component tests. Wraps the UI in the same providers
 * the app uses — next-intl (real merged messages) and a fresh TanStack Query
 * client — so components that call `useTranslations` / `useLocale` / hooks that
 * read the query cache render exactly as they do in production.
 */
import type { ReactElement, ReactNode } from "react";
import { render, type RenderOptions } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import { getMessages, type TestLocale } from "./messages";

type ProvidersProps = {
  children: ReactNode;
  locale?: TestLocale;
};

function Providers({ children, locale = "en" }: ProvidersProps) {
  // A fresh client per render keeps tests isolated and disables retries so
  // rejected queries surface immediately instead of hanging the test.
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });

  return (
    <QueryClientProvider client={queryClient}>
      <NextIntlClientProvider
        locale={locale}
        timeZone="UTC"
        messages={getMessages(locale)}
      >
        {children}
      </NextIntlClientProvider>
    </QueryClientProvider>
  );
}

export function renderWithProviders(
  ui: ReactElement,
  options: { locale?: TestLocale } & Omit<RenderOptions, "wrapper"> = {},
) {
  const { locale, ...renderOptions } = options;
  return render(ui, {
    wrapper: ({ children }) => <Providers locale={locale}>{children}</Providers>,
    ...renderOptions,
  });
}

export * from "@testing-library/react";
