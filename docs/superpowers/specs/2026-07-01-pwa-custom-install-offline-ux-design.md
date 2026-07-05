# PWA / Native-like Patient Portal — Phase 2: Custom Install + Offline UX

## Context

Phase 1 shipped the installable PWA shell: manifest, icon set, a Serwist service
worker that precaches the static shell and serves an offline fallback, and a hard
privacy boundary (authenticated patient APIs are never cached). See
`2026-06-30-pwa-installable-shell-design.md`.

Phase 1 left install entirely to the browser's default UI (the address-bar
"install" affordance) and gave the user no in-app signal when they go offline.
Phase 2 makes install a **branded, in-app moment** and makes the offline state
**visible**, so the app feels native rather than like a website that happens to be
installable.

This is **Phase 2** of a 4-phase effort, each with its own spec:
- Phase 1 — installable shell (done).
- **Phase 2 — custom install + offline UX (this spec).**
- Phase 3 — offline data (conservative PHI allowlist).
- Phase 4 — Web Push (cross-repo with `cradlen-api`).

### Constraints carried from the codebase

- Every URL is locale-prefixed (`/en/...`, `/ar/...`) via next-intl; Arabic is RTL.
  New UI must use logical Tailwind utilities and keep en/ar message parity.
- The house patterns Phase 2 follows:
  - **State:** Zustand + `persist` middleware, localStorage-backed
    (`src/features/patient-portal/store/patientProfileStore.ts`).
  - **App-level notices:** a small client component mounted once in
    `src/components/Providers.tsx` (`UpdateBanner` renders a persistent Sonner
    toast there).
  - **SW registration:** `src/components/pwa/ServiceWorkerRegister.tsx`, mounted in
    `src/app/[locale]/layout.tsx`.
- UI primitives available: `button`, `popover` (Radix). There is **no** Dialog /
  Sheet / Alert primitive — the iOS sheet is built self-contained.
- Nothing sensitive is stored: dismissal state is a timestamp + a boolean, which
  is fine for localStorage (unlike tokens/PHI, per AGENTS.md).

## Phase 2 Goal

Ship a branded, localized install experience and a visible offline indicator:

1. Capture the browser `beforeinstallprompt` event and offer install through a
   **custom branded bottom banner** (Install / Not now), shown app-wide including
   pre-login.
2. Persist a **14-day snooze** when the user dismisses the banner.
3. On **iOS Safari** (which has no install-prompt API), the Install action opens a
   **branded bottom-sheet** with manual "Share → Add to Home Screen" steps.
4. Show a **thin colored offline bar** while the device is offline, with a brief
   "back online" confirmation on reconnect.
5. All copy localized in **en/ar** with key parity.

Explicitly **out of scope** for Phase 2: caching any PHI or query data offline
(that is Phase 3), and push notifications (Phase 4). The offline bar is a *status
indicator only* — it does not change what data is available offline.

## Decisions (from brainstorming)

| Decision | Choice |
| --- | --- |
| Install banner audience | Everywhere, including pre-login, once `beforeinstallprompt` fires (or on iOS by platform). |
| Presentation | Custom branded bottom banner for install; thin colored bar for offline. |
| Dismiss persistence | Snooze ~14 days (persist a `dismissedAt` timestamp), then one more offer. |
| iOS instructions | Branded bottom-sheet modal with illustrated Share → Add to Home Screen steps. |

## Architecture

New feature module `src/features/pwa/`. Phase 1's `ServiceWorkerRegister` stays
where it is (no churn).

```
src/features/pwa/
  lib/platform.ts            # pure: isIOS(), isStandalone()  — no side effects
  lib/snooze.ts              # pure: canShowInstall({ installed, dismissedAt, now })
  store/installStore.ts      # zustand + persist; PERSISTS ONLY { dismissedAt, installed }
  hooks/useInstallPrompt.ts  # beforeinstallprompt / appinstalled listeners; state + actions
  hooks/useOnlineStatus.ts   # online / offline listeners; seeds from navigator.onLine
  components/InstallBanner.tsx     # branded bottom banner (Install / Not now)
  components/IosInstallSheet.tsx   # bottom-sheet modal, illustrated Share → Add steps
  components/OfflineBar.tsx        # thin colored bar while offline + brief "back online" flash
```

`InstallBanner` and `OfflineBar` are mounted once in `src/components/Providers.tsx`
(alongside the existing `UpdateBanner`), so they are present on every page in every
locale, including the pre-login signin surface.

### Design for isolation

- **Pure libs** (`platform.ts`, `snooze.ts`) contain all the branchable logic and
  are unit-tested with no DOM. `canShowInstall` is a pure function of
  `{ installed, dismissedAt, now }`.
- **Store** owns only persisted dismissal state; it holds the captured prompt event
  in a transient (non-persisted) field.
- **Hooks** own browser event wiring and expose a small interface to the
  components.
- **Components** are presentational: they read hook state and render, deciding
  nothing that isn't in a pure helper.

## Components & Data Flow

### 1. Store & the `beforeinstallprompt` capture — `store/installStore.ts`

Zustand store with `persist`:

- **Persisted (via `partialize`):**
  - `dismissedAt: number | null` — epoch ms of the last "Not now"; `null` = never.
  - `installed: boolean` — set `true` on the `appinstalled` event.
- **Transient (excluded from `partialize`, in-memory only):**
  - `deferredPrompt: BeforeInstallPromptEvent | null` — the captured event.
- **Actions:** `capturePrompt(e)`, `clearPrompt()`, `snooze(now)` (sets
  `dismissedAt`), `markInstalled()` (sets `installed`, clears prompt).

The `BeforeInstallPromptEvent` is **deliberately never persisted**: it is
non-serializable and single-use (each event instance's `prompt()` can be called
once). `partialize` returns only `{ dismissedAt, installed }`.

Persist key: `cradlen-patient-install`. Non-sensitive; localStorage is appropriate.

A `BeforeInstallPromptEvent` type is declared locally (it is not in the standard
DOM lib): `{ prompt(): Promise<void>; userChoice: Promise<{ outcome: "accepted" | "dismissed" }> } & Event`.

### 2. Install hook — `hooks/useInstallPrompt.ts`

On mount (client only):

- Adds a `beforeinstallprompt` listener → `e.preventDefault()`, `capturePrompt(e)`.
- Adds an `appinstalled` listener → `markInstalled()`.
- Cleans both up on unmount.

Exposes:

- `shouldShow: boolean` — `canShowInstall({ installed, dismissedAt, now: Date.now() })`
  AND `!isStandalone()` AND (`deferredPrompt !== null` OR `isIOS()`).
- `isIOS: boolean`.
- `promptInstall(): Promise<void>` — calls `deferredPrompt.prompt()`, awaits
  `userChoice`, then `clearPrompt()` (Android/desktop only).
- `snooze(): void` — `snooze(Date.now())`.

### 3. Snooze eligibility — `lib/snooze.ts`

```
const SNOOZE_MS = 14 * 24 * 60 * 60 * 1000;
export function canShowInstall({ installed, dismissedAt, now }): boolean {
  if (installed) return false;
  if (dismissedAt == null) return true;
  return now - dismissedAt > SNOOZE_MS;
}
```

### 4. Platform detection — `lib/platform.ts`

- `isIOS()` — iOS/iPadOS Safari user-agent detection (including iPadOS reporting as
  Mac with touch). Guarded for SSR (returns `false` when `navigator` is undefined).
- `isStandalone()` — `window.matchMedia("(display-mode: standalone)").matches`
  OR the iOS `navigator.standalone` flag. Guarded for SSR.

### 5. Install banner — `components/InstallBanner.tsx`

`"use client"`. Uses `useInstallPrompt` and `useTranslations("pwa")`.

- Renders `null` on first paint, reveals after mount (avoids hydration mismatch,
  since visibility depends on `navigator`/`matchMedia`/localStorage).
- Renders `null` when `!shouldShow`.
- Otherwise a branded bottom banner (brand color, app icon, title/body):
  - **Install:** non-iOS → `promptInstall()`; iOS → open `IosInstallSheet`.
  - **Not now:** `snooze()`.
- Logical utilities for RTL; fixed to the bottom, above the mobile tab bar.

### 6. iOS sheet — `components/IosInstallSheet.tsx`

`"use client"`, controlled by an `open` prop from the banner. Self-contained
bottom-sheet: fixed dimmed overlay + slide-up panel, focus-trapped, closes on Esc,
overlay click, and a Close button. Three illustrated steps: tap the **Share**
icon → **Add to Home Screen** → **Add**. Copy from `pwa.ios.*`.

### 7. Online status hook — `hooks/useOnlineStatus.ts`

Seeds `isOnline` from `navigator.onLine` after mount (starts optimistically
`true` during SSR/first paint), subscribes to `online`/`offline`, cleans up on
unmount.

### 8. Offline bar — `components/OfflineBar.tsx`

`"use client"`. Uses `useOnlineStatus` and `useTranslations("pwa")`.

- While offline: a thin fixed brand-colored bar showing `pwa.offline.message`.
- On transition offline→online: briefly (~2s) show a "back online" bar
  (`pwa.online.message`), then hide.
- Never shows on first load if online. Logical utilities for RTL.

## Localization

New **`pwa`** namespace in the **base** message files `src/messages/{en,ar}.json`
(not the portal-scoped file — the banner appears pre-login and app-wide). Keys:

```
pwa.install.title
pwa.install.body
pwa.install.action        # "Install"
pwa.install.dismiss       # "Not now"
pwa.ios.title
pwa.ios.step1             # tap the Share button
pwa.ios.step2             # choose "Add to Home Screen"
pwa.ios.step3             # tap "Add"
pwa.ios.close
pwa.offline.message       # "You're offline"
pwa.online.message        # "Back online"
```

English and Arabic must stay in key parity (verified in CI/lint per AGENTS.md).

## Error Handling & Edge Cases

- **Non-serializable prompt event:** excluded from persistence via `partialize`;
  only held in memory.
- **Already installed / standalone:** banner suppressed via `isStandalone()` and
  the `installed` flag, so an installed app never nags the user to install.
- **iOS:** no `beforeinstallprompt`; banner qualifies on `isIOS()` alone and routes
  Install to the manual sheet.
- **SSR/hydration:** all `navigator`/`window`/`matchMedia`/localStorage access is
  guarded and deferred to effects; components render `null` until mounted.
- **`prompt()` reuse:** the event is cleared after use so it can't be re-fired.
- **Offline bar is status-only:** it does not imply cached data is available
  (Phase 3 concern).

## Testing

- **Unit (vitest):**
  - `snooze.ts` — `canShowInstall` matrix: installed; never-dismissed; within
    14 days; past 14 days; boundary.
  - `platform.ts` — `isIOS`/`isStandalone` across representative UAs / matchMedia
    stubs, incl. SSR-undefined guards.
  - `installStore.ts` — `partialize` persists only `{ dismissedAt, installed }`
    (never `deferredPrompt`); actions mutate as specified.
- **Component (vitest + Testing Library):**
  - `InstallBanner` — hidden when installed/standalone/snoozed; shown when
    eligible; **Not now** calls snooze; iOS **Install** opens the sheet; non-iOS
    **Install** calls `promptInstall`.
  - `OfflineBar` — hidden when online; shown when offline; flashes then hides on
    reconnect.
- **E2E (Playwright):**
  - Offline bar appears when `context.setOffline(true)` and clears on reconnect —
    works against the dev server.
  - **Known gap:** `beforeinstallprompt` cannot be reliably synthesized in
    Playwright/Chromium, so install-banner behavior is covered by unit/component
    tests, not e2e. Documented, not silently skipped.

## Critical Files (Phase 2)

- `src/features/pwa/lib/{platform,snooze}.ts` (new)
- `src/features/pwa/store/installStore.ts` (new)
- `src/features/pwa/hooks/{useInstallPrompt,useOnlineStatus}.ts` (new)
- `src/features/pwa/components/{InstallBanner,IosInstallSheet,OfflineBar}.tsx` (new)
- `src/components/Providers.tsx` (mount `InstallBanner` + `OfflineBar`)
- `src/messages/{en,ar}.json` (new `pwa` namespace, en/ar parity)
- tests colocated per house convention (`__tests__` / `*.test.ts(x)`) + one e2e spec

## Verification (Phase 2)

- `npm run lint`, `npx tsc --noEmit --pretty false`, `npm run build`, `npm test`
  all clean; en/ar `pwa` key parity verified.
- `npm run dev` (port 3200):
  - Android/desktop Chromium: banner appears; **Install** triggers the native
    prompt; accepting installs standalone; **Not now** hides it and it stays hidden
    for 14 days (localStorage `cradlen-patient-install`).
  - Simulated iOS UA: banner appears; **Install** opens the bottom-sheet with the
    Share → Add steps; RTL correct under `/ar`.
  - DevTools "Offline": the offline bar appears; reconnect shows the brief "back
    online" bar then hides.
  - Confirm no banner when launched as an installed/standalone app.

## Post-approval workflow note

After this spec is approved, invoke the writing-plans skill to produce the detailed
TDD implementation plan, then execute it via subagent-driven development (same flow
as Phase 1).
