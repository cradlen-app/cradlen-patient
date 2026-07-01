"use client";

import { useSyncExternalStore } from "react";

const noop = () => () => {};

/**
 * Tracks connectivity via the browser `online`/`offline` events using
 * `useSyncExternalStore` (the blessed subscription pattern here, mirroring
 * `useMediaQuery`). Reports `true` during SSR/first paint so nothing flashes
 * before hydration.
 */
export function useOnlineStatus(): boolean {
  return useSyncExternalStore(
    (notify) => {
      if (typeof window === "undefined") return noop();
      window.addEventListener("online", notify);
      window.addEventListener("offline", notify);
      return () => {
        window.removeEventListener("online", notify);
        window.removeEventListener("offline", notify);
      };
    },
    () => (typeof navigator === "undefined" ? true : navigator.onLine),
    () => true,
  );
}
