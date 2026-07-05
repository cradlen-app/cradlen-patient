"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { isIOS } from "@/features/pwa/lib/platform";
import { IosInstallSheet } from "@/features/pwa/components/IosInstallSheet";
import { useHydrated } from "@/features/pwa/hooks/useHydrated";
import { usePushSubscription } from "@/features/push/hooks/usePushSubscription";
import { SectionCard } from "../portal-ui";

/**
 * Profile "Notifications" section: an explicit opt-in switch backed by
 * `usePushSubscription`. On a non-installed iOS browser (where PushManager is
 * absent, so status is "unsupported"), we surface an install hint that opens the
 * Phase 2 install sheet instead of a dead toggle. Gated on hydration so the
 * client-only push/platform reads never cause a mismatch.
 */
export function PushNotificationsSection() {
  const t = useTranslations("patientPortal");
  const hydrated = useHydrated();
  const { status, busy, enable, disable } = usePushSubscription();
  const [sheetOpen, setSheetOpen] = useState(false);

  if (!hydrated) return null;

  // Non-installed iOS: push is "unsupported", but installing unlocks it.
  if (status === "unsupported") {
    if (!isIOS()) return null;
    return (
      <SectionCard title={t("pushNotifications.title")}>
        <p className="text-sm text-gray-500">
          {t("pushNotifications.iosInstallHint")}
        </p>
        <Button
          type="button"
          size="sm"
          variant="outline"
          className="mt-2"
          onClick={() => setSheetOpen(true)}
        >
          {t("pushNotifications.iosInstallAction")}
        </Button>
        <IosInstallSheet open={sheetOpen} onClose={() => setSheetOpen(false)} />
      </SectionCard>
    );
  }

  const checked = status === "subscribed";
  const busyLabel = checked
    ? t("pushNotifications.disabling")
    : t("pushNotifications.enabling");

  return (
    <SectionCard title={t("pushNotifications.title")}>
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm text-gray-600">
            {t("pushNotifications.description")}
          </p>
          {status === "denied" && (
            <p className="mt-1 text-xs text-destructive">
              {t("pushNotifications.deniedNote")}
            </p>
          )}
        </div>
        {status !== "denied" && (
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-400">
              {busy
                ? busyLabel
                : checked
                  ? t("pushNotifications.on")
                  : t("pushNotifications.off")}
            </span>
            <Switch
              checked={checked}
              disabled={busy}
              onCheckedChange={(next) => (next ? void enable() : void disable())}
              aria-label={t("pushNotifications.title")}
            />
          </div>
        )}
      </div>
    </SectionCard>
  );
}
