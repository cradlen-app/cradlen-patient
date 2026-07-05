import { beforeEach, describe, expect, it, vi } from "vitest";
import type { BeforeInstallPromptEvent } from "../installStore";

function fakePromptEvent(): BeforeInstallPromptEvent {
  return {
    prompt: vi.fn().mockResolvedValue(undefined),
    userChoice: Promise.resolve({ outcome: "accepted" as const }),
  } as unknown as BeforeInstallPromptEvent;
}

/** jsdom's localStorage stub is incomplete here; use a real in-memory Storage. */
function memoryStorage(): Storage {
  const map = new Map<string, string>();
  return {
    getItem: (k) => (map.has(k) ? (map.get(k) as string) : null),
    setItem: (k, v) => void map.set(k, String(v)),
    removeItem: (k) => void map.delete(k),
    clear: () => map.clear(),
    key: (i) => Array.from(map.keys())[i] ?? null,
    get length() {
      return map.size;
    },
  } as Storage;
}

// zustand's persist middleware captures the storage at module-init time, so the
// working localStorage must be in place *before* the store module is imported.
let mod: typeof import("../installStore");

beforeEach(async () => {
  vi.resetModules();
  vi.stubGlobal("localStorage", memoryStorage());
  mod = await import("../installStore");
});

describe("useInstallStore actions", () => {
  it("capturePrompt / clearPrompt manage the transient event", () => {
    const event = fakePromptEvent();
    mod.useInstallStore.getState().capturePrompt(event);
    expect(mod.useInstallStore.getState().deferredPrompt).toBe(event);

    mod.useInstallStore.getState().clearPrompt();
    expect(mod.useInstallStore.getState().deferredPrompt).toBeNull();
  });

  it("snooze records the dismissal timestamp", () => {
    mod.useInstallStore.getState().snooze(12345);
    expect(mod.useInstallStore.getState().dismissedAt).toBe(12345);
  });

  it("markInstalled sets installed and clears any captured prompt", () => {
    mod.useInstallStore.getState().capturePrompt(fakePromptEvent());
    mod.useInstallStore.getState().markInstalled();
    expect(mod.useInstallStore.getState().installed).toBe(true);
    expect(mod.useInstallStore.getState().deferredPrompt).toBeNull();
  });
});

describe("persistence (partialize)", () => {
  it("persists only { dismissedAt, installed } and never the prompt event", () => {
    mod.useInstallStore.getState().capturePrompt(fakePromptEvent());
    mod.useInstallStore.getState().snooze(999);
    mod.useInstallStore.getState().markInstalled();

    const raw = localStorage.getItem(mod.INSTALL_STORE_KEY);
    expect(raw).not.toBeNull();
    const persisted = JSON.parse(raw as string).state;

    expect(persisted).toEqual({ dismissedAt: 999, installed: true });
    expect(persisted).not.toHaveProperty("deferredPrompt");
  });
});
