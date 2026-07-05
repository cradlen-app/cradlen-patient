import { create } from "zustand";
import { persist } from "zustand/middleware";

/**
 * The `beforeinstallprompt` event is not in the standard DOM lib. It is fired by
 * Chromium browsers, is single-use (`prompt()` may be called once per event),
 * and is deliberately **never persisted** — it is non-serializable and would be
 * stale on the next load.
 */
export type BeforeInstallPromptEvent = Event & {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

type InstallState = {
  /** Epoch ms of the last "Not now"; `null` = never dismissed. Persisted. */
  dismissedAt: number | null;
  /** Set once the `appinstalled` event fires. Persisted. */
  installed: boolean;
  /** The captured, single-use prompt event. In-memory only, never persisted. */
  deferredPrompt: BeforeInstallPromptEvent | null;

  capturePrompt: (event: BeforeInstallPromptEvent) => void;
  clearPrompt: () => void;
  snooze: (now: number) => void;
  markInstalled: () => void;
};

/** Non-sensitive dismissal state — localStorage is appropriate (unlike tokens/PHI). */
export const INSTALL_STORE_KEY = "cradlen-patient-install";

export const useInstallStore = create<InstallState>()(
  persist(
    (set) => ({
      dismissedAt: null,
      installed: false,
      deferredPrompt: null,

      capturePrompt: (event) => set({ deferredPrompt: event }),
      clearPrompt: () => set({ deferredPrompt: null }),
      snooze: (now) => set({ dismissedAt: now }),
      markInstalled: () => set({ installed: true, deferredPrompt: null }),
    }),
    {
      name: INSTALL_STORE_KEY,
      // Only the durable dismissal state is persisted. The prompt event is
      // transient and excluded so it never lands in localStorage.
      partialize: (state) => ({
        dismissedAt: state.dismissedAt,
        installed: state.installed,
      }),
    },
  ),
);
