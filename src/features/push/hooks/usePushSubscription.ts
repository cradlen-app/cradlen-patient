"use client";

import { useCallback, useEffect, useState } from "react";
import { apiFetch } from "@/infrastructure/http/api";
import {
  isPushSupported,
  urlBase64ToUint8Array,
  VAPID_PUBLIC_KEY,
} from "../lib/vapid";

export type PushStatus =
  | "unsupported" // no SW/PushManager/Notification API, or no VAPID key configured
  | "default" // supported, permission not yet requested
  | "denied" // user blocked notifications at the browser level
  | "subscribed"; // permission granted and an active subscription is registered

async function registerSubscription(sub: PushSubscription): Promise<void> {
  const json = sub.toJSON();
  await apiFetch("/api/patient-portal/push/subscribe", {
    method: "POST",
    body: JSON.stringify({ endpoint: json.endpoint, keys: json.keys }),
  });
}

/**
 * Manages this browser's Web Push subscription against the patient portal's
 * same-origin `/api/patient-portal/push/*` proxy routes. Headless and
 * idempotent — read `status`, call `enable()` / `disable()` from an explicit
 * opt-in control, or `resync()` to re-register an already-granted subscription
 * without prompting. Ported from cradlen-web `usePushSubscription`.
 */
export function usePushSubscription() {
  const [status, setStatus] = useState<PushStatus>("unsupported");
  const [busy, setBusy] = useState(false);

  const refresh = useCallback(async () => {
    if (!isPushSupported()) return setStatus("unsupported");
    if (Notification.permission === "denied") return setStatus("denied");
    const reg = await navigator.serviceWorker.ready;
    const sub = await reg.pushManager.getSubscription();
    setStatus(
      sub && Notification.permission === "granted" ? "subscribed" : "default",
    );
  }, []);

  useEffect(() => {
    // refresh() reads browser-only push state (permission + existing
    // subscription) after mount; its setState runs after async work, not as a
    // synchronous cascade.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void refresh();
  }, [refresh]);

  const enable = useCallback(async () => {
    if (!isPushSupported() || busy) return;
    setBusy(true);
    try {
      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        setStatus(permission === "denied" ? "denied" : "default");
        return;
      }
      const reg = await navigator.serviceWorker.ready;
      const sub =
        (await reg.pushManager.getSubscription()) ??
        (await reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
        }));
      await registerSubscription(sub);
      setStatus("subscribed");
    } finally {
      setBusy(false);
    }
  }, [busy]);

  const disable = useCallback(async () => {
    if (!isPushSupported() || busy) return;
    setBusy(true);
    try {
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.getSubscription();
      if (sub) {
        await apiFetch("/api/patient-portal/push/unsubscribe", {
          method: "POST",
          body: JSON.stringify({ endpoint: sub.endpoint }),
        }).catch(() => null);
        await sub.unsubscribe().catch(() => false);
      }
      setStatus("default");
    } finally {
      setBusy(false);
    }
  }, [busy]);

  // Silent: re-register an existing grant with the backend (e.g. after re-login).
  // Never requests permission, so it's safe to call on every authenticated load.
  const resync = useCallback(async () => {
    if (!isPushSupported() || Notification.permission !== "granted") return;
    const reg = await navigator.serviceWorker.ready;
    const sub = await reg.pushManager.getSubscription();
    if (!sub) return;
    await registerSubscription(sub).catch(() => null);
    setStatus("subscribed");
  }, []);

  return { status, busy, enable, disable, resync, supported: isPushSupported() };
}
