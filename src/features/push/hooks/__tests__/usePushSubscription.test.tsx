import { afterEach, describe, expect, it, vi } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";

vi.mock("@/infrastructure/http/api", () => ({ apiFetch: vi.fn().mockResolvedValue(undefined) }));
vi.mock("../../lib/vapid", () => ({
  VAPID_PUBLIC_KEY: "test-key",
  isPushSupported: () => true,
  urlBase64ToUint8Array: () => new Uint8Array(new ArrayBuffer(1)),
}));

import { usePushSubscription } from "../usePushSubscription";

function stubServiceWorker(getSubscription: () => Promise<unknown>) {
  vi.stubGlobal("navigator", {
    serviceWorker: {
      ready: Promise.resolve({ pushManager: { getSubscription, subscribe: vi.fn() } }),
    },
  });
}

afterEach(() => vi.unstubAllGlobals());

describe("usePushSubscription", () => {
  it("reports 'denied' when the browser permission is denied", async () => {
    vi.stubGlobal("Notification", { permission: "denied" });
    stubServiceWorker(async () => null);
    const { result } = renderHook(() => usePushSubscription());
    await waitFor(() => expect(result.current.status).toBe("denied"));
  });

  it("reports 'default' when granted-but-not-subscribed", async () => {
    vi.stubGlobal("Notification", { permission: "granted" });
    stubServiceWorker(async () => null);
    const { result } = renderHook(() => usePushSubscription());
    await waitFor(() => expect(result.current.status).toBe("default"));
  });

  it("reports 'subscribed' when a subscription exists and permission is granted", async () => {
    vi.stubGlobal("Notification", { permission: "granted" });
    stubServiceWorker(async () => ({ endpoint: "e-1" }));
    const { result } = renderHook(() => usePushSubscription());
    await waitFor(() => expect(result.current.status).toBe("subscribed"));
  });
});
