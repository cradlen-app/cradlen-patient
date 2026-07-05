import { describe, expect, it, vi } from "vitest";
import { render, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

const { invalidate } = vi.hoisted(() => ({ invalidate: vi.fn() }));
vi.mock("@tanstack/react-query", async (orig) => {
  const actual = await orig<typeof import("@tanstack/react-query")>();
  return { ...actual, useQueryClient: () => ({ invalidateQueries: invalidate }) };
});
vi.mock("@/features/auth/hooks/usePatientAuth", () => ({
  usePatientMe: () => ({ data: { account_id: "acc-1" } }),
}));
const { resync } = vi.hoisted(() => ({ resync: vi.fn() }));
vi.mock("../../hooks/usePushSubscription", () => ({
  usePushSubscription: () => ({ resync }),
}));

import { PushNotificationProvider } from "../PushNotificationProvider";

const listeners: Record<string, (e: MessageEvent) => void> = {};
function stubSW() {
  vi.stubGlobal("navigator", {
    serviceWorker: {
      addEventListener: (t: string, h: (e: MessageEvent) => void) => (listeners[t] = h),
      removeEventListener: () => delete listeners.message,
    },
  });
}

// Global cleanup (jsdom navigator restore + RTL unmount) is handled by
// src/test/setup.ts's afterEach, which runs `cleanup()` before
// `vi.unstubAllGlobals()`. A local `afterEach(() => vi.unstubAllGlobals())`
// here would register a second afterEach that (per Vitest's LIFO afterEach
// ordering) runs *before* the global one, unstubbing `navigator` while the
// component is still mounted — the effect cleanup's
// `navigator.serviceWorker.removeEventListener` call then throws because the
// restored jsdom `navigator` has no `serviceWorker`. Rely on the global hook.

function renderProvider() {
  const qc = new QueryClient();
  return render(
    <QueryClientProvider client={qc}>
      <PushNotificationProvider />
    </QueryClientProvider>,
  );
}

describe("PushNotificationProvider", () => {
  it("resyncs the subscription once the patient is authenticated", async () => {
    stubSW();
    renderProvider();
    await waitFor(() => expect(resync).toHaveBeenCalled());
  });

  it("invalidates the notifications query on a cradlen:notification message", () => {
    stubSW();
    renderProvider();
    listeners.message?.({ data: { type: "cradlen:notification" } } as MessageEvent);
    expect(invalidate).toHaveBeenCalledWith({
      queryKey: ["patient-portal", "notifications"],
    });
  });
});
