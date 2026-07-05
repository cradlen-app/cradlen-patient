"use client";

import { useEffect } from "react";

/**
 * Registers the Serwist service worker at `/sw.js` on mount.
 *
 * Register-only — no `waiting`/reload prompt is added here. The existing
 * `UpdateBanner` + `useVersionCheck` system owns the user-facing "update
 * available" flow. The SW is configured with `skipWaiting`/`clientsClaim` so
 * the new version activates on the next navigation without a second prompt.
 */
export function ServiceWorkerRegister() {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;
    let cancelled = false;
    (async () => {
      try {
        const { Serwist } = await import("@serwist/window");
        if (cancelled) return;
        const serwist = new Serwist("/sw.js", { scope: "/", type: "classic" });
        // Intentionally no `waiting`/reload handler: avoid double update prompts.
        void serwist.register();
      } catch {
        // SW registration is best-effort; the app works without it.
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return null;
}
