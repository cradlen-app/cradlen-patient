"use client";

import Image from "next/image";
import { useState } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { useInstallPrompt } from "../hooks/useInstallPrompt";
import { IosInstallSheet } from "./IosInstallSheet";

/**
 * Branded bottom banner offering install. It appears app-wide (including
 * pre-login) once the browser signals installability, or on iOS by platform.
 * Install fires the native prompt on Android/desktop, or opens the manual
 * {@link IosInstallSheet} on iOS. "Not now" snoozes it for 14 days.
 *
 * Returns `null` until eligibility is known (the hook only resolves
 * browser/localStorage state after mount), so it never causes a hydration
 * mismatch and never shows inside an already-installed app.
 */
export function InstallBanner() {
  const { shouldShow, isIOS, promptInstall, snooze } = useInstallPrompt();
  const t = useTranslations("pwa");
  const [sheetOpen, setSheetOpen] = useState(false);

  if (!shouldShow) return null;

  const onInstall = () => {
    if (isIOS) {
      setSheetOpen(true);
    } else {
      void promptInstall();
    }
  };

  return (
    <>
      <div className="fixed inset-x-0 bottom-0 z-50 pb-[calc(env(safe-area-inset-bottom)+4.5rem)] sm:pb-4">
        <div className="mx-auto flex max-w-md items-center gap-3 rounded-2xl bg-brand-primary p-3 text-white shadow-lg ms-3 me-3">
          <Image
            src="/icons/icon-192.png"
            alt=""
            width={40}
            height={40}
            className="size-10 shrink-0 rounded-lg"
          />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold">{t("install.title")}</p>
            <p className="truncate text-xs text-white/80">{t("install.body")}</p>
          </div>
          <div className="flex shrink-0 items-center gap-1.5">
            <Button
              type="button"
              size="sm"
              variant="ghost"
              onClick={snooze}
              className="text-white/80 hover:bg-white/10 hover:text-white"
            >
              {t("install.dismiss")}
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={onInstall}
              className="bg-white text-brand-primary hover:bg-white/90"
            >
              {t("install.action")}
            </Button>
          </div>
        </div>
      </div>

      <IosInstallSheet open={sheetOpen} onClose={() => setSheetOpen(false)} />
    </>
  );
}
