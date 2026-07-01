"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import { isIOS as detectIOS } from "../lib/platform";
import { canShowInstall } from "../lib/snooze";
import {
  type BeforeInstallPromptEvent,
  useInstallStore,
} from "../store/installStore";

type UseInstallPrompt = {
  /** Whether the branded install banner should be shown right now. */
  shouldShow: boolean;
  /** iOS/iPadOS Safari — routes Install to the manual "Add to Home Screen" sheet. */
  isIOS: boolean;
  /** Fire the native prompt (Android/desktop only); resolves after the choice. */
  promptInstall: () => Promise<void>;
  /** Dismiss for the snooze window ("Not now"). */
  snooze: () => void;
};

/** iOS Safari exposes a non-standard `navigator.standalone` flag. */
type IosNavigator = Navigator & { standalone?: boolean };

const emptySubscribe = () => () => {};

/**
 * `false` on the server and during the hydration render (matching the SSR HTML,
 * so the banner never causes a hydration mismatch), then `true`. Uses the same
 * `useSyncExternalStore` mechanism as `useMediaQuery`, which React hydrates via
 * the server snapshot first.
 */
function useHydrated(): boolean {
  return useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false,
  );
}

/**
 * Bridges the browser install lifecycle to the app. Captures
 * `beforeinstallprompt` (preventing the browser's own mini-infobar) and
 * `appinstalled`, and composes the pure eligibility logic with platform state
 * into a single `shouldShow` signal for the banner.
 *
 * `shouldShow` requires the app not already be installed/standalone, be within
 * eligibility (snooze), and either have a captured prompt (Android/desktop) or
 * be on iOS (which has no prompt API but still gets the manual sheet).
 */
export function useInstallPrompt(): UseInstallPrompt {
  const dismissedAt = useInstallStore((s) => s.dismissedAt);
  const installed = useInstallStore((s) => s.installed);
  const deferredPrompt = useInstallStore((s) => s.deferredPrompt);
  const capturePrompt = useInstallStore((s) => s.capturePrompt);
  const clearPrompt = useInstallStore((s) => s.clearPrompt);
  const markInstalled = useInstallStore((s) => s.markInstalled);
  const snoozeAction = useInstallStore((s) => s.snooze);

  const hydrated = useHydrated();
  // Captured once at mount; the 14-day snooze window is coarse enough that a
  // per-render clock is unnecessary (and would be an impure render read).
  const [now] = useState(() => Date.now());
  const displayModeStandalone = useMediaQuery("(display-mode: standalone)");

  useEffect(() => {
    const onBeforeInstallPrompt = (event: Event) => {
      event.preventDefault();
      capturePrompt(event as BeforeInstallPromptEvent);
    };
    const onAppInstalled = () => markInstalled();

    window.addEventListener("beforeinstallprompt", onBeforeInstallPrompt);
    window.addEventListener("appinstalled", onAppInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onBeforeInstallPrompt);
      window.removeEventListener("appinstalled", onAppInstalled);
    };
  }, [capturePrompt, markInstalled]);

  const isIOS = hydrated && detectIOS();
  const iosStandalone =
    hydrated &&
    typeof navigator !== "undefined" &&
    (navigator as IosNavigator).standalone === true;
  const standalone = displayModeStandalone || iosStandalone;

  const eligible = canShowInstall({ installed, dismissedAt, now });
  const shouldShow =
    hydrated && eligible && !standalone && (deferredPrompt !== null || isIOS);

  async function promptInstall() {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    await deferredPrompt.userChoice;
    // The event is single-use; drop it so it can't be re-fired.
    clearPrompt();
  }

  function snooze() {
    snoozeAction(Date.now());
  }

  return { shouldShow, isIOS, promptInstall, snooze };
}
