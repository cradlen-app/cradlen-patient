# Design Spec — PWA Phase 1: Installable App Shell

**Date:** 2026-06-30
**Repo:** `cradlen-patient`
**Status:** Draft for review
**Phase:** 1 of 4 (Installable shell → Custom install/offline UX → Offline data → Web Push)

## Problem & Goal

The Cradlen patient portal is a network-only web app with **zero PWA
infrastructure** — no manifest, no service worker, no install metadata, no offline
behavior. Patients increasingly expect a "native app" experience: an icon on the
home screen, a standalone window with no browser chrome, instant launch, and
graceful behavior when the connection drops.

This is the first of four phases toward that experience. **Phase 1 delivers an
installable app shell**: the app can be installed to the home screen, launches
standalone with correct branding, loads its static shell fast from cache, and shows
a friendly offline page instead of a browser error — **without caching any
authenticated patient data**.

Out of scope for Phase 1 (later phases): a custom install prompt/banner, offline
viewing of health records, and push notifications.

## Constraints & Context

- **Locale-prefixed routing.** Every URL is `/en/...` or `/ar/...` (next-intl).
  Install metadata must not lock a user into one locale.
- **Health data on shared devices.** Patients view PHI (visits, meds, lab results),
  often on shared/family devices. Auth is HttpOnly cookies
  (`cradlen-patient-token` / refresh) gated in `src/proxy.ts`. The service worker
  **must never cache authenticated API responses** in Phase 1.
- **Icons are misplaced.** Brand icons live in `src/public/` (`Logo.png`,
  `Logo-icon.png`) — Next.js does not serve that path. There is no root `public/`.
- **Existing build config.** `next.config.ts` composes
  `withSentryConfig(withNextIntl(nextConfig))` and sets security headers; an active
  CSP exists (recent "tighten CSP connect-src" commit).
- **Existing update mechanism.** `UpdateBanner.tsx` + `useVersionCheck.ts` poll
  `/api/version` every 5 minutes to surface new deployments. The service-worker
  update lifecycle must coexist with this, not create a competing reload prompt.
- **Next.js 16.2.9 / React 19.** Per `AGENTS.md`, treat this as "not the Next.js you
  know" — verify current manifest/metadata APIs against `node_modules/next/dist/docs`.

## Approach

### Tooling decision: Serwist (with a fallback)

`next-pwa` is effectively unmaintained and predates the App Router. **Serwist
(`@serwist/next`)** is its maintained, Workbox-based successor and the current
standard for App Router PWAs.

**Risk + mitigation:** Serwist's published Next.js support may lag 16.2.x. The first
implementation task is to **verify `@serwist/next` peer-deps/support for Next
16.2.x**. If it is not compatible, fall back to a **hand-rolled service worker**
(`public/sw.js` + a small client registration component). This choice only affects
the service-worker tasks; the manifest, icons, and metadata work is identical either
way.

### Components & responsibilities

Each unit below has one clear purpose and a well-defined interface.

1. **Icon set (`public/icons/*`)** — static, installable-grade icons generated from
   the existing logo: `icon-192.png`, `icon-512.png`, `icon-maskable-512.png`
   (safe-zone padded), `apple-touch-icon.png` (180×180). Depends on nothing;
   consumed by the manifest and layout metadata. *Requires creating a real root
   `public/` directory.*

2. **Web App Manifest (`src/app/manifest.ts`)** — returns
   `MetadataRoute.Manifest`. Declares `name`, `short_name`, `description`,
   `start_url: "/"` (locale-neutral — the existing root redirect resolves the user's
   locale, so a single install serves both en and ar), `scope: "/"`,
   `display: "standalone"`, brand `theme_color`/`background_color`, `orientation`,
   and the icon set including a `maskable` entry. Interface: served at
   `/manifest.webmanifest`; must be publicly reachable (not auth-gated).

3. **Install metadata (root layout)** — `viewport` export (`themeColor`,
   `viewportFit: "cover"`) and `metadata` extensions (`manifest`, `icons`,
   `appleWebApp: { capable, statusBarStyle, title }`) so iOS and Android render the
   correct install affordance, icon, and standalone status bar. Interface: static
   `<head>` tags; depends on the icon set + manifest existing.

4. **Service worker (`src/app/sw.ts` via Serwist, or `public/sw.js` fallback)** —
   the caching brain. Responsibilities:
   - Precache the build's static shell (JS/CSS/fonts).
   - Runtime-cache images and fonts (CacheFirst).
   - Serve the document shell NetworkFirst.
   - **NetworkOnly for `/api/patient-portal/*` and `/api/patient-auth/*`** — the hard
     privacy boundary; no PHI or tokens ever enter Cache Storage.
   - Serve an **offline fallback page** for navigations when the network is down.
   Interface: registered at origin root scope; consumes the Serwist build manifest.

5. **Offline fallback page** — a minimal, localized (en/ar) static page explaining
   the app is offline. Depends on i18n messages; reachable from the SW's navigation
   fallback. No data, no auth.

6. **SW registration + update coexistence** — a small `"use client"` registration
   (Serwist's helper or a mounted component in the locale layout). The SW update
   lifecycle (`skipWaiting`/`clientsClaim`) is reconciled with the existing
   `UpdateBanner`/`useVersionCheck` so the user sees **one** "update available"
   experience, not two. Decision: let the existing banner own the user-facing reload
   prompt; the SW activates the new version on that reload.

### Data flow

- **First visit:** HTML + assets fetched from network → SW installs, precaches the
  shell → manifest + metadata advertise installability → browser offers install.
- **Installed launch:** standalone window opens `start_url: "/"` → root redirect →
  localized portal. Shell served from cache (fast); API calls always hit the network
  (fresh PHI, gated by `src/proxy.ts` + HttpOnly cookies).
- **Offline navigation:** SW finds no network → serves the offline fallback page for
  document requests; cached static assets still render; API requests fail normally
  (no stale PHI shown).

### Security & CSP

- Verify the active CSP allows the PWA surface: `manifest-src 'self'`,
  `worker-src 'self'`, and `script-src` permitting the SW. Confirm the SW is served
  from origin root so its scope covers the app.
- Confirm `src/proxy.ts` does not auth-gate `/manifest.webmanifest`, the service
  worker script, or the offline page (all must work pre-login).
- Per `AGENTS.md` shared-code drift rule: if CSP/brand tokens change, mirror the
  relevant change to `cradlen-web`.

## Error Handling

- **SW registration failure** must be non-fatal — the app continues to work as a
  normal web app; failure is logged (Sentry) but never blocks rendering.
- **Manifest/icon load failure** degrades to "not installable" rather than breaking
  the page.
- **API requests offline** surface the app's existing error/empty states; they are
  never served stale from cache in Phase 1.

## Testing & Verification

Automated:
- `npm run lint`, `npx tsc --noEmit --pretty false`, `npm run build` all clean.

Manual (Chrome DevTools → Application, on `npm run dev` port 3200):
- Manifest parses with no errors; all icons (incl. maskable) load.
- Service worker registers and activates; Lighthouse **PWA / installability** passes.
- **Cache audit:** after visiting record/visits pages, confirm **no**
  `/api/patient-portal/*` or `/api/patient-auth/*` responses exist in Cache Storage.
- **Offline:** with DevTools "Offline", a cold navigation shows the offline fallback
  (not a browser error); previously loaded static shell still renders.
- **Install:** install on desktop + Android Chrome → launches standalone with correct
  icon, name, and theme color; `start_url` resolves to the user's locale.
- **Locale parity:** installing from `/ar/...` (RTL) behaves the same as `/en/...`.

## Roadmap (subsequent phases, each its own spec)

- **Phase 2 — Custom install + offline UX:** `beforeinstallprompt` → Zustand store →
  branded "Add to Home Screen" banner (dismiss-persistent); iOS Safari manual-install
  instructions; `navigator.onLine` offline banner. Localized en/ar.
- **Phase 3 — Offline data (conservative allowlist):** persist TanStack Query cache to
  IndexedDB for a read-only allowlist of PHI query keys (visits/meds/labs — never
  auth/`me`), short `maxAge`, build-id `buster`, hard purge on logout.
- **Phase 4 — Web Push (cross-repo):** `cradlen-api` gains a `PatientPushSubscription`
  model + subscribe/unsubscribe endpoints + a `PatientPushService` (reusing existing
  VAPID config and the `admin-push.service.ts` pattern), with dispatch hooked into
  `PatientNotificationsService.create()`; `cradlen-patient` gains SW `push`/
  `notificationclick` handlers and a settings toggle.
