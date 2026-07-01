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
