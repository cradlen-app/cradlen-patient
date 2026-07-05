"use client";

import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { usePatientMe } from "@/features/auth/hooks/usePatientAuth";
import { patientPortalQueryKeys } from "@/features/patient-portal/api";
import { usePushSubscription } from "../hooks/usePushSubscription";

/**
 * Headless. Mounted once in `Providers`. Two jobs:
 *  1. Keep the in-app notification feed fresh when a push arrives while a tab is
 *     open: the service worker postMessages `cradlen:notification`, and we
 *     invalidate the notifications query so the bell badge updates without a poll.
 *  2. Silently re-register an already-granted push subscription after (re)login,
 *     so a returning patient keeps receiving pushes. Never prompts — enabling is
 *     always an explicit action in the profile Notifications section.
 */
export function PushNotificationProvider() {
  const queryClient = useQueryClient();
  const { data: me } = usePatientMe();
  const { resync } = usePushSubscription();
  const authed = Boolean(me);

  useEffect(() => {
    if (typeof navigator === "undefined" || !("serviceWorker" in navigator)) {
      return;
    }
    const handler = (event: MessageEvent) => {
      if (event.data?.type === "cradlen:notification") {
        queryClient.invalidateQueries({
          queryKey: patientPortalQueryKeys.notifications(),
        });
      }
    };
    navigator.serviceWorker.addEventListener("message", handler);
    return () =>
      navigator.serviceWorker.removeEventListener("message", handler);
  }, [queryClient]);

  useEffect(() => {
    if (authed) void resync();
  }, [authed, resync]);

  return null;
}
