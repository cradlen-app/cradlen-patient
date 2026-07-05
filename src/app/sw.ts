/// <reference lib="webworker" />
import { defaultCache } from "@serwist/next/worker";
import type { PrecacheEntry, SerwistGlobalConfig } from "serwist";
import { NetworkOnly, Serwist } from "serwist";
import { isPatientApiPath } from "./sw-routes";

declare global {
  interface WorkerGlobalScope extends SerwistGlobalConfig {
    __SW_MANIFEST: (PrecacheEntry | string)[] | undefined;
  }
}

declare const self: ServiceWorkerGlobalScope;

const serwist = new Serwist({
  precacheEntries: self.__SW_MANIFEST,
  skipWaiting: true,
  clientsClaim: true,
  navigationPreload: true,
  runtimeCaching: [
    // Hard privacy boundary: authenticated patient API responses are NEVER
    // cached. Registered FIRST so it wins over defaultCache's "/api/" NetworkFirst
    // (route matching is first-match-wins by registration order).
    {
      matcher: ({ url, sameOrigin }) => sameOrigin && isPatientApiPath(url.pathname),
      handler: new NetworkOnly(),
    },
    // NOTE: defaultCache still caches page HTML + RSC payloads for /en|ar/patient/*
    // (its matchers only exclude /api/*). That is PHI-safe ONLY because every
    // portal screen is a client-rendered shell — PHI arrives via the guarded
    // /api/patient-portal/* client calls above, never in the server-rendered
    // document. If any /patient/* page ever server-renders a patient datum, it
    // would be written to Cache Storage and persist past logout on a shared
    // device. Keep portal pages client-rendered, or add an explicit NetworkOnly
    // guard here for them. (See AGENTS.md "PWA / Service-worker caching".)
    ...defaultCache,
  ],
  fallbacks: {
    entries: [
      {
        url: "/~offline",
        matcher({ request }) {
          return request.destination === "document";
        },
      },
    ],
  },
});

serwist.addEventListeners();

// --- Web Push --------------------------------------------------------------
// Payload is produced by the backend PatientPushService.sendToPatient(...).
// Carries only what the in-app feed already shows (title/body/navigate_to) —
// never raw PHI. The pure mapper is unit-tested in features/push/lib.
import { buildNotificationOptions, type PushPayload } from "@/features/push/lib/pushPayload";
import {
  localeFromClientUrls,
  resolvePatientDeepLink,
} from "@/features/push/lib/deepLink";

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
  const navigateTo = event.notification.data?.navigate_to as
    | string
    | null
    | undefined;

  event.waitUntil(
    (async () => {
      const clients = await self.clients.matchAll({
        type: "window",
        includeUncontrolled: true,
      });
      // The backend sends a bare portal path (e.g. "/tests"); resolve it to the
      // real locale-prefixed route the app actually serves ("/<locale>/patient/…"),
      // mirroring how the in-app feed uses patientHref + the locale-aware router.
      // Locale is taken from an open tab so the click stays in the user's language.
      const locale = localeFromClientUrls(clients.map((c) => c.url));
      const targetUrl = new URL(
        resolvePatientDeepLink(navigateTo, locale),
        self.registration.scope,
      );

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
