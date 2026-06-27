// Root error boundary — no i18n provider available
"use client";

import { useEffect } from "react";
import Image from "next/image";
import logoIcon from "@/public/Logo-icon.png";
import "@/styles/globals.css";

export default function GlobalError({
  error,
  unstable_retry,
}: {
  error: Error & { digest?: string };
  unstable_retry: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full bg-background text-foreground">
        <main className="grid min-h-svh place-items-center px-6">
          <section className="flex w-full max-w-sm flex-col items-center text-center">
            <div className="mb-6 grid size-24 place-items-center rounded-full bg-brand-secondary/10">
              <Image
                src={logoIcon}
                alt=""
                width={64}
                height={64}
                className="size-16 object-contain"
              />
            </div>
            <h1 className="text-2xl font-semibold text-brand-black">
              Something went wrong
            </h1>
            <p className="mt-3 text-sm leading-6 text-muted-foreground">
              We could not load this page. Try again and we will attempt to
              recover it.
            </p>
            <button
              type="button"
              onClick={() => unstable_retry()}
              className="mt-7 inline-flex h-10 items-center justify-center rounded-lg bg-brand-primary px-5 text-sm font-medium text-white transition-colors hover:bg-brand-primary/90 focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-brand-primary/30"
            >
              Try again
            </button>
          </section>
        </main>
      </body>
    </html>
  );
}
