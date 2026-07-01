# Patient Web Push — Frontend (cradlen-patient) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Give signed-in patients an opt-in Web Push experience in cradlen-patient — a service-worker push handler, a subscription hook + headless provider, same-origin proxy routes, and a Notifications toggle in the profile screen (with an iOS "install first" hint).

**Architecture:** Port the proven `cradlen-web` push frontend (`usePushSubscription`, `PushNotificationProvider`, `sw.ts` push/notificationclick handlers) into a new `src/features/push/` module, adapting the transport to the patient app's same-origin `apiFetch` + `/api/patient-portal/push/*` proxy routes and its `usePatientMe` auth gate. Consumes the backend contract from the companion backend plan.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript, Serwist SW, next-intl (en/ar), TanStack Query, Zustand, radix-ui, vitest + Testing Library, Playwright.

## Global Constraints

- **Depends on** the backend plan `2026-07-01-patient-web-push-backend.md` for the live endpoints `POST /v1/patient-portal/push/{subscribe,unsubscribe}`. The frontend degrades gracefully until they exist.
- **VAPID public key** is read from `process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY` (empty → push reported `unsupported`, all UI hidden). Must equal the backend `VAPID_PUBLIC_KEY`.
- **No PHI in the SW / payload beyond the in-app notification's own `{title, body, navigate_to, tag}`.** Push adds nothing cacheable (SW `NetworkOnly` patient-API guard is untouched).
- **Same-origin transport only:** browser → `apiFetch("/api/patient-portal/push/...")` → `proxyAuthenticatedPatientRequest` attaches the HttpOnly token. Never call the backend directly from the client.
- **This repo's React 19 lint rules** reject `Date.now()`/impure calls and synchronous `setState` in effects (`react-hooks/purity`, `set-state-in-effect`). Use `useSyncExternalStore` for client-only reads (mirror `src/hooks/useMediaQuery.ts`), or the documented `// eslint-disable-next-line react-hooks/set-state-in-effect` used by the ported hook.
- **i18n:** new keys under the `patientPortal` namespace in `src/features/patient-portal/messages/{en,ar}.json`; keep en/ar parity (verified in CI). Logical Tailwind utilities (`ms-`/`me-`) + RTL.
- **Verification per handoff:** `npm run lint`, `npx tsc --noEmit --pretty false`, `npm test`, `npm run build` all clean.

---

### Task 1: VAPID lib + env

**Files:**
- Create: `src/features/push/lib/vapid.ts`
- Test: `src/features/push/lib/__tests__/vapid.test.ts`
- Modify: `.env.example` (document `NEXT_PUBLIC_VAPID_PUBLIC_KEY`)

**Interfaces:**
- Produces: `VAPID_PUBLIC_KEY: string`, `urlBase64ToUint8Array(base64: string): Uint8Array<ArrayBuffer>`, `isPushSupported(): boolean`.

- [ ] **Step 1: Write the failing test**

Create `src/features/push/lib/__tests__/vapid.test.ts`:

```ts
import { afterEach, describe, expect, it, vi } from "vitest";
import { urlBase64ToUint8Array } from "../vapid";

afterEach(() => vi.unstubAllGlobals());

describe("urlBase64ToUint8Array", () => {
  it("decodes a base64url string to the raw key bytes", () => {
    // "hello" base64 is "aGVsbG8="; base64url drops padding.
    const out = urlBase64ToUint8Array("aGVsbG8");
    expect(Array.from(out)).toEqual([104, 101, 108, 108, 111]);
    expect(out.buffer).toBeInstanceOf(ArrayBuffer);
  });

  it("restores base64url substitutions (- _ ) and padding", () => {
    // 0xFB 0xFF encodes as "-_8" in base64url ("+/8" in standard base64).
    const out = urlBase64ToUint8Array("-_8");
    expect(Array.from(out)).toEqual([251, 255]);
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npx vitest run src/features/push/lib/__tests__/vapid.test.ts`
Expected: FAIL — cannot resolve `../vapid`.

- [ ] **Step 3: Implement the lib**

Create `src/features/push/lib/vapid.ts`:

```ts
// The VAPID public key is inlined at build time. It is non-sensitive and must
// match the backend's VAPID_PUBLIC_KEY. When unset, push is treated as
// unsupported and the UI degrades gracefully (no "enable" affordance).
export const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ?? "";

/**
 * Web Push wants the application server key as raw bytes, not base64url. Backed
 * by an explicit ArrayBuffer so the result is `Uint8Array<ArrayBuffer>` (what
 * `applicationServerKey: BufferSource` expects), not the `ArrayBufferLike`
 * variant that includes SharedArrayBuffer.
 */
export function urlBase64ToUint8Array(
  base64String: string,
): Uint8Array<ArrayBuffer> {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(base64);
  const output = new Uint8Array(new ArrayBuffer(raw.length));
  for (let i = 0; i < raw.length; i += 1) output[i] = raw.charCodeAt(i);
  return output;
}

/**
 * True only when this browser can register a push subscription AND a VAPID key
 * is configured. iOS Safari exposes PushManager only in an installed
 * (standalone) app, so a non-installed iOS browser reports `false` here.
 */
export function isPushSupported(): boolean {
  return (
    typeof window !== "undefined" &&
    "serviceWorker" in navigator &&
    "PushManager" in window &&
    "Notification" in window &&
    VAPID_PUBLIC_KEY.length > 0
  );
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npx vitest run src/features/push/lib/__tests__/vapid.test.ts`
Expected: PASS.

- [ ] **Step 5: Document the env var**

Add to `.env.example`:

```bash
# Web Push VAPID public key (must match the backend VAPID_PUBLIC_KEY).
# Generate the pair with: npx web-push generate-vapid-keys
# When empty, in-app notifications still work but push is disabled/hidden.
NEXT_PUBLIC_VAPID_PUBLIC_KEY=
```

- [ ] **Step 6: Commit**

```bash
git add src/features/push/lib/vapid.ts src/features/push/lib/__tests__/vapid.test.ts .env.example
git commit -m "feat(push): vapid lib + NEXT_PUBLIC_VAPID_PUBLIC_KEY env"
```

---

### Task 2: Service-worker push handlers

**Files:**
- Create: `src/features/push/lib/pushPayload.ts` (pure mapper, unit-testable)
- Test: `src/features/push/lib/__tests__/pushPayload.test.ts`
- Modify: `src/app/sw.ts` (add `push` + `notificationclick` listeners)

**Interfaces:**
- Produces: `type PushPayload = { title?: string; body?: string; navigate_to?: string | null; tag?: string }`; `buildNotificationOptions(payload: PushPayload): { title: string; options: NotificationOptions }`.

- [ ] **Step 1: Write the failing mapper test**

Create `src/features/push/lib/__tests__/pushPayload.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { buildNotificationOptions } from "../pushPayload";

describe("buildNotificationOptions", () => {
  it("maps a full payload to notification options", () => {
    const { title, options } = buildNotificationOptions({
      title: "Result ready",
      body: "Your CBC result has been reviewed.",
      navigate_to: "/tests",
      tag: "notif-1",
    });
    expect(title).toBe("Result ready");
    expect(options.body).toBe("Your CBC result has been reviewed.");
    expect(options.icon).toBe("/icons/icon-192.png");
    expect(options.badge).toBe("/icons/icon-192.png");
    expect(options.tag).toBe("notif-1");
    expect(options.data).toEqual({ navigate_to: "/tests" });
  });

  it("defaults the title and null navigate_to when absent", () => {
    const { title, options } = buildNotificationOptions({ body: "hi" });
    expect(title).toBe("Cradlen");
    expect(options.data).toEqual({ navigate_to: null });
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npx vitest run src/features/push/lib/__tests__/pushPayload.test.ts`
Expected: FAIL — cannot resolve `../pushPayload`.

- [ ] **Step 3: Implement the pure mapper**

Create `src/features/push/lib/pushPayload.ts`:

```ts
/** Shape of the JSON the backend PatientPushService sends in a push message. */
export type PushPayload = {
  title?: string;
  body?: string;
  navigate_to?: string | null;
  tag?: string;
};

/**
 * Pure mapping from a push payload to `showNotification` arguments. Extracted so
 * the branch logic (default title, null navigate_to) is unit-testable outside
 * the service-worker runtime.
 */
export function buildNotificationOptions(payload: PushPayload): {
  title: string;
  options: NotificationOptions;
} {
  return {
    title: payload.title || "Cradlen",
    options: {
      body: payload.body,
      icon: "/icons/icon-192.png",
      badge: "/icons/icon-192.png",
      tag: payload.tag,
      data: { navigate_to: payload.navigate_to ?? null },
    },
  };
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npx vitest run src/features/push/lib/__tests__/pushPayload.test.ts`
Expected: PASS.

- [ ] **Step 5: Add the SW listeners**

In `src/app/sw.ts`, after the existing `serwist.addEventListeners();` line, append:

```ts

// --- Web Push --------------------------------------------------------------
// Payload is produced by the backend PatientPushService.sendToPatient(...).
// Carries only what the in-app feed already shows (title/body/navigate_to) —
// never raw PHI. The pure mapper is unit-tested in features/push/lib.
import { buildNotificationOptions, type PushPayload } from "@/features/push/lib/pushPayload";

self.addEventListener("push", (event) => {
  if (!event.data) return;

  let payload: PushPayload;
  try {
    payload = event.data.json() as PushPayload;
  } catch {
    payload = { title: "Cradlen", body: event.data.text() };
  }

  event.waitUntil(
    (async () => {
      const { title, options } = buildNotificationOptions(payload);
      await self.registration.showNotification(title, options);

      // Keep an open tab's in-app feed/badge fresh without a poll.
      const clients = await self.clients.matchAll({
        type: "window",
        includeUncontrolled: true,
      });
      for (const client of clients) {
        client.postMessage({ type: "cradlen:notification" });
      }
    })(),
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const target =
    (event.notification.data?.navigate_to as string | null | undefined) || "/";
  const targetUrl = new URL(target, self.registration.scope);

  event.waitUntil(
    (async () => {
      const clients = await self.clients.matchAll({
        type: "window",
        includeUncontrolled: true,
      });
      // If a tab is already on the deep link, just focus it — never navigate a
      // tab the user may be mid-task in (e.g. document upload), discarding input.
      for (const client of clients) {
        if (new URL(client.url).pathname === targetUrl.pathname) {
          await client.focus();
          return;
        }
      }
      await self.clients.openWindow(targetUrl.href);
    })(),
  );
});
```

(Imports may be hoisted to the top of the file by the formatter — that is fine; esbuild bundles the `@/features/push/lib/pushPayload` import into the worker.)

- [ ] **Step 6: Typecheck the worker and run the mapper test**

Run: `npx tsc --noEmit --pretty false && npx vitest run src/features/push/lib/__tests__/pushPayload.test.ts`
Expected: no type errors; test PASS.

- [ ] **Step 7: Commit**

```bash
git add src/features/push/lib/pushPayload.ts \
        src/features/push/lib/__tests__/pushPayload.test.ts \
        src/app/sw.ts
git commit -m "feat(push): service-worker push + notificationclick handlers"
```

---

### Task 3: Same-origin proxy routes

**Files:**
- Create: `src/app/api/patient-portal/push/subscribe/route.ts`
- Create: `src/app/api/patient-portal/push/unsubscribe/route.ts`
- Test: `src/app/api/patient-portal/push/__tests__/push-routes.test.ts`

**Interfaces:**
- Consumes: `proxyAuthenticatedPatientRequest(request, backendPath)` from `@/infrastructure/auth-transport/patient-auth`.
- Produces: `POST /api/patient-portal/push/subscribe` → backend `/patient-portal/push/subscribe`; same for unsubscribe.

- [ ] **Step 1: Write the failing route test**

Create `src/app/api/patient-portal/push/__tests__/push-routes.test.ts`:

```ts
import { describe, expect, it, vi } from "vitest";

const proxy = vi.fn().mockResolvedValue(new Response(null, { status: 200 }));
vi.mock("@/infrastructure/auth-transport/patient-auth", () => ({
  proxyAuthenticatedPatientRequest: proxy,
}));

import { POST as subscribePost } from "../subscribe/route";
import { POST as unsubscribePost } from "../unsubscribe/route";

function req() {
  return new Request("http://localhost/api/patient-portal/push/subscribe", {
    method: "POST",
    body: "{}",
  }) as unknown as import("next/server").NextRequest;
}

describe("patient push routes", () => {
  it("subscribe proxies to the backend subscribe path", async () => {
    await subscribePost(req());
    expect(proxy).toHaveBeenCalledWith(
      expect.anything(),
      "/patient-portal/push/subscribe",
    );
  });

  it("unsubscribe proxies to the backend unsubscribe path", async () => {
    await unsubscribePost(req());
    expect(proxy).toHaveBeenCalledWith(
      expect.anything(),
      "/patient-portal/push/unsubscribe",
    );
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npx vitest run src/app/api/patient-portal/push/__tests__/push-routes.test.ts`
Expected: FAIL — cannot resolve `../subscribe/route`.

- [ ] **Step 3: Implement the routes**

Create `src/app/api/patient-portal/push/subscribe/route.ts`:

```ts
import { type NextRequest } from "next/server";
import { proxyAuthenticatedPatientRequest } from "@/infrastructure/auth-transport/patient-auth";

/** Register a Web Push subscription → POST /v1/patient-portal/push/subscribe. */
export async function POST(request: NextRequest) {
  return proxyAuthenticatedPatientRequest(
    request,
    "/patient-portal/push/subscribe",
  );
}
```

Create `src/app/api/patient-portal/push/unsubscribe/route.ts`:

```ts
import { type NextRequest } from "next/server";
import { proxyAuthenticatedPatientRequest } from "@/infrastructure/auth-transport/patient-auth";

/** Remove a Web Push subscription → POST /v1/patient-portal/push/unsubscribe. */
export async function POST(request: NextRequest) {
  return proxyAuthenticatedPatientRequest(
    request,
    "/patient-portal/push/unsubscribe",
  );
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npx vitest run src/app/api/patient-portal/push/__tests__/push-routes.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/app/api/patient-portal/push
git commit -m "feat(push): same-origin subscribe/unsubscribe proxy routes"
```

---

### Task 4: usePushSubscription hook

**Files:**
- Create: `src/features/push/hooks/usePushSubscription.ts`
- Test: `src/features/push/hooks/__tests__/usePushSubscription.test.tsx`

**Interfaces:**
- Consumes: `isPushSupported`, `urlBase64ToUint8Array`, `VAPID_PUBLIC_KEY` (Task 1); `apiFetch` from `@/infrastructure/http/api`.
- Produces: `usePushSubscription()` → `{ status: "unsupported" | "default" | "denied" | "subscribed"; busy: boolean; enable: () => Promise<void>; disable: () => Promise<void>; resync: () => Promise<void>; supported: boolean }`.

- [ ] **Step 1: Write the failing hook test**

Create `src/features/push/hooks/__tests__/usePushSubscription.test.tsx`. It stubs the push browser APIs and asserts the state machine resolves to `denied` and `default`:

```tsx
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
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npx vitest run src/features/push/hooks/__tests__/usePushSubscription.test.tsx`
Expected: FAIL — cannot resolve `../usePushSubscription`.

- [ ] **Step 3: Implement the hook (ported, patient transport)**

Create `src/features/push/hooks/usePushSubscription.ts`:

```ts
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
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npx vitest run src/features/push/hooks/__tests__/usePushSubscription.test.tsx`
Expected: PASS (all three cases).

- [ ] **Step 5: Commit**

```bash
git add src/features/push/hooks
git commit -m "feat(push): usePushSubscription state machine (patient transport)"
```

---

### Task 5: PushNotificationProvider + mount

**Files:**
- Create: `src/features/push/components/PushNotificationProvider.tsx`
- Test: `src/features/push/components/__tests__/PushNotificationProvider.test.tsx`
- Modify: `src/components/Providers.tsx`

**Interfaces:**
- Consumes: `usePushSubscription` (Task 4); `usePatientMe` from `@/features/auth/hooks/usePatientAuth`; `patientPortalQueryKeys.notifications()` from `@/features/patient-portal/queryKeys`; `useQueryClient`.
- Produces: `<PushNotificationProvider />` headless component.

- [ ] **Step 1: Write the failing provider test**

Create `src/features/push/components/__tests__/PushNotificationProvider.test.tsx`:

```tsx
import { afterEach, describe, expect, it, vi } from "vitest";
import { render, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

const invalidate = vi.fn();
vi.mock("@tanstack/react-query", async (orig) => {
  const actual = await orig<typeof import("@tanstack/react-query")>();
  return { ...actual, useQueryClient: () => ({ invalidateQueries: invalidate }) };
});
vi.mock("@/features/auth/hooks/usePatientAuth", () => ({
  usePatientMe: () => ({ data: { account_id: "acc-1" } }),
}));
const resync = vi.fn();
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

afterEach(() => vi.unstubAllGlobals());

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
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npx vitest run src/features/push/components/__tests__/PushNotificationProvider.test.tsx`
Expected: FAIL — cannot resolve `../PushNotificationProvider`.

- [ ] **Step 3: Implement the provider**

Create `src/features/push/components/PushNotificationProvider.tsx`:

```tsx
"use client";

import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { usePatientMe } from "@/features/auth/hooks/usePatientAuth";
import { patientPortalQueryKeys } from "@/features/patient-portal/queryKeys";
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
```

- [ ] **Step 4: Mount it in `src/components/Providers.tsx`**

Add the import:

```tsx
import { PushNotificationProvider } from "@/features/push/components/PushNotificationProvider";
```

Add `<PushNotificationProvider />` inside `QueryClientProvider`, next to the other mounted helpers:

```tsx
      <UpdateBanner />
      <OfflineBar />
      <InstallBanner />
      <PushNotificationProvider />
```

- [ ] **Step 5: Run the provider test + typecheck**

Run: `npx vitest run src/features/push/components/__tests__/PushNotificationProvider.test.tsx && npx tsc --noEmit --pretty false`
Expected: PASS and no type errors.

- [ ] **Step 6: Commit**

```bash
git add src/features/push/components/PushNotificationProvider.tsx \
        src/features/push/components/__tests__/PushNotificationProvider.test.tsx \
        src/components/Providers.tsx
git commit -m "feat(push): headless PushNotificationProvider mounted in Providers"
```

---

### Task 6: Switch primitive + profile Notifications section

**Files:**
- Create: `src/components/ui/switch.tsx`
- Create: `src/features/pwa/hooks/useHydrated.ts` (shared client-mounted gate)
- Create: `src/features/patient-portal/components/profile/PushNotificationsSection.tsx`
- Test: `src/features/patient-portal/components/profile/PushNotificationsSection.test.tsx`
- Modify: `src/features/patient-portal/components/ProfileScreen.tsx` (render the section)
- Modify: `src/features/patient-portal/messages/en.json` and `.../ar.json` (new keys, parity)

**Interfaces:**
- Consumes: `usePushSubscription` (Task 4); `isIOS` from `@/features/pwa/lib/platform`; `IosInstallSheet` from `@/features/pwa/components/IosInstallSheet`; `SectionCard` from `@/features/patient-portal/components/portal-ui`; `useTranslations("patientPortal")`.
- Produces: `useHydrated(): boolean`; `<Switch>`; `<PushNotificationsSection />`.

- [ ] **Step 1: Add the shared hydration hook**

Create `src/features/pwa/hooks/useHydrated.ts`:

```ts
"use client";

import { useSyncExternalStore } from "react";

const emptySubscribe = () => () => {};

/**
 * `false` on the server and during the hydration render (matching SSR HTML),
 * then `true`. Uses the same `useSyncExternalStore` mechanism as
 * `useMediaQuery`, which React hydrates via the server snapshot first — so
 * gating client-only UI on this never causes a hydration mismatch.
 */
export function useHydrated(): boolean {
  return useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false,
  );
}
```

- [ ] **Step 2: Add the shadcn switch primitive**

Create `src/components/ui/switch.tsx` (radix-ui unified package, matching `button.tsx`'s import style):

```tsx
"use client";

import * as React from "react";
import { Switch as SwitchPrimitive } from "radix-ui";

import { cn } from "@/common/utils/utils";

function Switch({
  className,
  ...props
}: React.ComponentProps<typeof SwitchPrimitive.Root>) {
  return (
    <SwitchPrimitive.Root
      data-slot="switch"
      className={cn(
        "peer inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full border border-transparent transition-colors outline-none focus-visible:ring-3 focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:bg-brand-primary data-[state=unchecked]:bg-gray-200",
        className,
      )}
      {...props}
    >
      <SwitchPrimitive.Thumb
        data-slot="switch-thumb"
        className={cn(
          "pointer-events-none block size-4 rounded-full bg-white shadow-sm ring-0 transition-transform data-[state=checked]:translate-x-4 data-[state=unchecked]:translate-x-0.5 rtl:data-[state=checked]:-translate-x-4 rtl:data-[state=unchecked]:-translate-x-0.5",
        )}
      />
    </SwitchPrimitive.Root>
  );
}

export { Switch };
```

- [ ] **Step 3: Add i18n keys (en + ar parity)**

In `src/features/patient-portal/messages/en.json`, add under the existing `profile` object (or a new sibling `pushNotifications` key at the top level of the portal messages) — use a top-level `pushNotifications` group:

```json
  "pushNotifications": {
    "title": "Notifications",
    "description": "Get notified about new prescriptions and test results.",
    "on": "On",
    "off": "Off",
    "enabling": "Enabling…",
    "disabling": "Disabling…",
    "deniedNote": "Notifications are blocked. Enable them in your browser settings.",
    "iosInstallHint": "Install Cradlen to your Home Screen to turn on notifications.",
    "iosInstallAction": "Show me how"
  }
```

Add the Arabic equivalents in `src/features/patient-portal/messages/ar.json` under the same `pushNotifications` key:

```json
  "pushNotifications": {
    "title": "الإشعارات",
    "description": "احصل على إشعارات بالوصفات الجديدة ونتائج الفحوصات.",
    "on": "مُفعّل",
    "off": "مُعطّل",
    "enabling": "جارٍ التفعيل…",
    "disabling": "جارٍ الإيقاف…",
    "deniedNote": "الإشعارات محظورة. فعّلها من إعدادات المتصفح.",
    "iosInstallHint": "ثبّت كرادلن على شاشتك الرئيسية لتفعيل الإشعارات.",
    "iosInstallAction": "أرِني الطريقة"
  }
```

- [ ] **Step 4: Write the failing section test**

Create `src/features/patient-portal/components/profile/PushNotificationsSection.test.tsx`:

```tsx
import { beforeEach, describe, expect, it, vi } from "vitest";
import userEvent from "@testing-library/user-event";
import { renderWithProviders, screen } from "@/test/render";

const push = {
  status: "default" as string,
  busy: false,
  supported: true,
  enable: vi.fn(),
  disable: vi.fn(),
  resync: vi.fn(),
};
vi.mock("../../../../features/push/hooks/usePushSubscription", () => ({
  usePushSubscription: () => push,
}));
vi.mock("@/features/pwa/lib/platform", () => ({ isIOS: () => false }));

import { PushNotificationsSection } from "./PushNotificationsSection";

beforeEach(() => {
  push.status = "default";
  push.busy = false;
  push.supported = true;
  push.enable.mockClear();
  push.disable.mockClear();
});

describe("PushNotificationsSection", () => {
  it("renders the switch when supported", () => {
    renderWithProviders(<PushNotificationsSection />);
    expect(screen.getByText("Notifications")).toBeInTheDocument();
    expect(screen.getByRole("switch")).toBeInTheDocument();
  });

  it("calls enable when toggled on from default", async () => {
    renderWithProviders(<PushNotificationsSection />);
    await userEvent.click(screen.getByRole("switch"));
    expect(push.enable).toHaveBeenCalledTimes(1);
  });

  it("calls disable when toggled off from subscribed", async () => {
    push.status = "subscribed";
    renderWithProviders(<PushNotificationsSection />);
    await userEvent.click(screen.getByRole("switch"));
    expect(push.disable).toHaveBeenCalledTimes(1);
  });

  it("shows the denied note and no switch when blocked", () => {
    push.status = "denied";
    renderWithProviders(<PushNotificationsSection />);
    expect(screen.getByText(/blocked/i)).toBeInTheDocument();
    expect(screen.queryByRole("switch")).toBeNull();
  });

  it("renders nothing when unsupported on a non-iOS device", () => {
    push.status = "unsupported";
    push.supported = false;
    const { container } = renderWithProviders(<PushNotificationsSection />);
    expect(container).toBeEmptyDOMElement();
  });
});
```

- [ ] **Step 5: Run the test to verify it fails**

Run: `npx vitest run src/features/patient-portal/components/profile/PushNotificationsSection.test.tsx`
Expected: FAIL — cannot resolve `./PushNotificationsSection`.

- [ ] **Step 6: Implement the section**

Create `src/features/patient-portal/components/profile/PushNotificationsSection.tsx`:

```tsx
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
```

- [ ] **Step 7: Render the section in `ProfileScreen.tsx`**

Add the import next to the other profile-section imports:

```tsx
import { PushNotificationsSection } from "./profile/PushNotificationsSection";
```

Render it in the authenticated block, after `<SecurityQuestionForm />`:

```tsx
            <ChangePasswordForm />
            <SecurityQuestionForm />
            <PushNotificationsSection />
```

- [ ] **Step 8: Run the section test to verify it passes**

Run: `npx vitest run src/features/patient-portal/components/profile/PushNotificationsSection.test.tsx`
Expected: PASS (all cases).

- [ ] **Step 9: Commit**

```bash
git add src/components/ui/switch.tsx \
        src/features/pwa/hooks/useHydrated.ts \
        src/features/patient-portal/components/profile/PushNotificationsSection.tsx \
        src/features/patient-portal/components/profile/PushNotificationsSection.test.tsx \
        src/features/patient-portal/components/ProfileScreen.tsx \
        src/features/patient-portal/messages/en.json \
        src/features/patient-portal/messages/ar.json
git commit -m "feat(push): profile Notifications toggle with iOS install hint"
```

---

### Task 7: Full verification

**Files:** none (verification only).

- [ ] **Step 1: Lint**

Run: `npm run lint`
Expected: 0 errors (warnings only in generated `coverage/`, if present).

- [ ] **Step 2: Typecheck**

Run: `npx tsc --noEmit --pretty false`
Expected: no output, exit 0.

- [ ] **Step 3: Full test suite**

Run: `npm test`
Expected: all suites pass, including the new `src/features/push/**` and `PushNotificationsSection` tests.

- [ ] **Step 4: en/ar key parity for the new namespace**

Run:
```bash
node -e '
const en=require("./src/features/patient-portal/messages/en.json").pushNotifications;
const ar=require("./src/features/patient-portal/messages/ar.json").pushNotifications;
const ke=Object.keys(en).sort(), ka=Object.keys(ar).sort();
console.log(JSON.stringify(ke)===JSON.stringify(ka)?"PARITY OK":"PARITY FAIL "+ke+" vs "+ka);
'
```
Expected: `PARITY OK`.

- [ ] **Step 5: Production build**

Run: `npm run build`
Expected: build succeeds; the SW bundles the push handlers.

- [ ] **Step 6: Manual smoke (requires VAPID keys + backend)**

- Generate keys: `npx web-push generate-vapid-keys`. Set `VAPID_PUBLIC_KEY`/`VAPID_PRIVATE_KEY`/`VAPID_SUBJECT` on the backend and the same public key as `NEXT_PUBLIC_VAPID_PUBLIC_KEY` here.
- `npm run dev` (port 3200) + backend running. Sign in → Profile → toggle Notifications on → grant permission → confirm the switch reads "On".
- Trigger a clinical event (visit completed / investigation reviewed) for the patient (and for a dependent under a guardian login) → OS notification appears; the in-app feed refreshes; clicking routes to the deep link.
- Toggle off → no further pushes. With `NEXT_PUBLIC_VAPID_PUBLIC_KEY` empty → the section is hidden.

- [ ] **Step 7: Final commit (if any verification fixups were needed)**

```bash
git add -A
git commit -m "chore(push): frontend verification fixups"
```

---

## Self-Review Notes

- **Spec coverage:** SW handlers (Task 2), proxy routes (Task 3), hook state machine (Task 4), provider + mount + feed invalidation + login resync (Task 5), profile toggle with iOS install-sheet hint (Task 6), env + graceful degradation (Task 1), verification incl. parity (Task 7).
- **Type consistency:** `PushStatus` union and `usePushSubscription()` return shape are identical across the hook, provider, and section. `buildNotificationOptions(PushPayload)` is the single mapper used by the SW and tested in isolation. Proxy paths (`/patient-portal/push/subscribe|unsubscribe`) match the backend controller routes exactly.
- **Lint compliance:** the section gates client-only reads behind `useHydrated()` (useSyncExternalStore, no setState-in-effect); the ported hook keeps the single documented `eslint-disable` for its post-mount refresh, matching cradlen-web.
- **Known e2e gap:** real `push` delivery can't be reliably synthesized in Chromium; covered by unit/component tests + the manual smoke, not e2e (documented, not silently skipped).
```
