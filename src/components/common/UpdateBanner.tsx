"use client";

import { useEffect, useRef } from "react";
import { toast } from "sonner";
import { useTranslations } from "next-intl";
import { usePatientMe } from "@/features/auth/hooks/usePatientAuth";
import { useVersionCheck } from "@/infrastructure/config/useVersionCheck";

/**
 * Surfaces a non-blocking "a new version is available" prompt when the running
 * tab is older than the live deployment. Renders nothing itself — it fires a
 * single persistent, de-duplicated Sonner toast with a Refresh action.
 *
 * Deliberately never auto-reloads: a patient mid-form (uploading a document,
 * filling intake) must not lose unsaved input, so refreshing is always their
 * choice. Only polls while a patient is signed in. Mounted once in `Providers`.
 */
export function UpdateBanner() {
  const { data: me } = usePatientMe();
  const { updateAvailable } = useVersionCheck(Boolean(me));
  const t = useTranslations("appUpdate");
  const shown = useRef(false);

  useEffect(() => {
    if (!updateAvailable || shown.current) return;
    shown.current = true;

    toast(t("title"), {
      id: "app-update", // de-duplicated, like the subscription-expired toast
      description: t("description"),
      duration: Infinity, // persists until the user acts on it
      action: {
        label: t("refresh"),
        onClick: () => window.location.reload(),
      },
    });
  }, [updateAvailable, t]);

  return null;
}
