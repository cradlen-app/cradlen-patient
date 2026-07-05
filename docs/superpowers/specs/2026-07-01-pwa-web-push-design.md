# PWA / Native-like Patient Portal — Phase 4: Web Push (cross-repo)

## Context

The goal is to make the Cradlen patient portal feel like a native app. This is
**Phase 4** of a 4-phase PWA roadmap:

- Phase 1 — installable shell (done).
- Phase 2 — custom install + offline UX (done).
- Phase 3 — offline data (conservative PHI allowlist) — not yet built.
- **Phase 4 — Web Push (this spec).**

Today the portal only surfaces clinical updates through an **in-app** notification
feed (`/api/patient-portal/notifications`), refreshed by polling. Patients have no
way to learn about a new prescription, ordered investigation, or reviewed result
unless they open the app. Push notifications are the single biggest remaining
"native" differentiator, and both repos already contain proven reference
implementations to mirror:

- `cradlen-web` has the full **frontend** pattern (`usePushSubscription`,
  `PushNotificationProvider`, `sw.ts` `push`/`notificationclick` handlers).
- `cradlen-api` has the full **backend** pattern for admin and staff push
  (`admin-push.service.ts` / `push.service.ts`, `web-push`, VAPID config,
  subscribe/unsubscribe controllers, stale-subscription pruning).

Phase 4 is deliberately a **full vertical, cross-repo** change: a new backend push
slice in `cradlen-api` plus the frontend surface in `cradlen-patient`, delivered
together so the feature is testable end-to-end.

### Decisions (from brainstorming)

| Decision | Choice |
| --- | --- |
| Scope | Full vertical in one spec: backend + frontend, sequenced backend → frontend. |
| Triggers | Mirror the **existing** patient notification events — no new event sources. |
| Dependents | Push to **every account that can access the patient** (guardian receives a dependent's notifications). Subscription is tied to the login account; dispatch fans out. |
| Toggle location | A **Notifications section in the profile screen** (no new route). |
| iOS (non-standalone) | Show an **install hint** that opens the Phase 2 `IosInstallSheet`, not a dead toggle. |

### Constraints carried from the codebase

- **Patient auth is account-based, not `profile_id`-based.** `PatientAccount.id`
  (= `accountId`) has exactly one of `patient_id` (self) or `guardian_id`
  (guardian). A guardian reaches multiple patients via `PatientGuardian` rows.
- **PHI on shared/family devices.** Push payloads must carry only what the in-app
  feed already shows (title/description/`navigate_to`), pre-localized at creation
  time — never raw clinical values. Authenticated patient APIs are never cached
  (SW `NetworkOnly` guard); push adds no cacheable PHI.
- **Same-origin proxy.** Browser calls go through Next route handlers under
  `/api/patient-portal/*` which attach the HttpOnly patient token server-side via
  `proxyAuthenticatedPatientRequest`. Push subscribe/unsubscribe follow this.
- **Shared VAPID config already exists** in `cradlen-api`
  (`src/config/push.config.ts`: `VAPID_PUBLIC_KEY` / `VAPID_PRIVATE_KEY` /
  `VAPID_SUBJECT`). Patient push reuses it; the same public key is exposed to the
  patient frontend as `NEXT_PUBLIC_VAPID_PUBLIC_KEY`.
- **Graceful degradation:** with VAPID unset the backend no-ops and the frontend
  reports `unsupported` — no crash, no visible toggle.

## Phase 4 Goal

Let a signed-in patient opt into browser push notifications from the profile
screen, and deliver a push whenever a patient notification is created for any
patient the account can access — reusing the existing clinical event sources and
the existing VAPID setup, with no new PHI exposure.

Explicitly **out of scope:** new notification event types, notification preference
granularity (per-category opt-in), offline data caching (Phase 3), and scheduled/
marketing pushes.

## Architecture

### Backend (`cradlen-api`, NestJS) — new patient push slice

Mirrors `src/core/platform-admin/push/` and `src/core/notifications/push.*`.

```
prisma/schema.prisma
  + model PatientPushSubscription        # account_id -> PatientAccount
  + PatientAccount.push_subscriptions relation
  + migration (must pass `migrate:check`)

src/core/patient-portal/push/
  patient-push.service.ts                # subscribe / unsubscribe / sendToPatient
  patient-push.controller.ts             # POST /v1/patient-portal/push/{subscribe,unsubscribe}
  patient-push.module.ts                 # exports PatientPushService
  dto/patient-push.dto.ts                # PushSubscribeDto / PushUnsubscribeDto (mirror existing)
```

**Prisma model** (mirrors `AdminPushSubscription`, keyed to the login account):

```prisma
model PatientPushSubscription {
  id         String         @id @default(uuid()) @db.Uuid
  account_id String         @db.Uuid
  account    PatientAccount @relation(fields: [account_id], references: [id], onDelete: Cascade)
  endpoint   String         @unique
  p256dh     String
  auth       String
  user_agent String?
  created_at DateTime       @default(now())
  updated_at DateTime       @updatedAt

  @@index([account_id])
  @@map("patient_push_subscriptions")
}
```

**`PatientPushService`** — reuses `pushConfig` and the `web-push` library exactly as
`AdminPushService` does (`webpush.setVapidDetails(...)` in `onModuleInit`, wrapped
in try/catch; inert when `pushConfig.enabled` is false):

- `subscribe(accountId, dto, userAgent?): Promise<void>` — upsert by `endpoint`
  (update keys + `account_id` on conflict), like the admin service.
- `unsubscribe(accountId, endpoint): Promise<void>` — owner-scoped delete
  (`where: { account_id, endpoint }`).
- `sendToPatient(patientId, payload): void` — **fire-and-forget** fan-out
  (returns `void`, dispatch runs async). Steps:
  1. Resolve accessible accounts for `patientId`:
     - the patient's own account: `PatientAccount(patient_id = patientId, is_active, !is_deleted)`;
     - guardian accounts: `PatientGuardian(patient_id = patientId, !is_deleted)` →
       `guardian_id`s → `PatientAccount(guardian_id IN (...), is_active, !is_deleted)`.
  2. Load `PatientPushSubscription`s for those account ids.
  3. `webpush.sendNotification(sub, JSON.stringify(payload))` for each; collect
     endpoints failing with `statusCode` 404/410 and bulk-delete them
     (`deleteMany({ where: { endpoint: { in: stale } } })`), logging the pruned count.

`PatientPushPayload = { title: string; body: string; navigate_to?: string | null; tag?: string }`.

**Controller** — `@Controller({ path: 'patient-portal/push', version: '1' })`,
`@UseGuards(PatientJwtAuthGuard)`, `@CurrentPatient()` → `accountId`. Two POSTs
(`subscribe`, `unsubscribe`) returning `{ success: true }`, capturing the
`User-Agent` header on subscribe. DTOs mirror the existing `PushSubscribeDto` /
`PushUnsubscribeDto` (class-validator, nested `keys`).

**Module** — `PatientPushModule` provides + exports `PatientPushService`;
registered in the app module and imported where the listener lives.

**Dispatch hook** — inject `PatientPushService` into `PatientNotificationsListener`
(`src/core/patient-portal/notifications/patient-notifications.listener.ts`). After
each `await this.patientNotifications.create(...)` (currently the
`visit.status_updated → COMPLETED` and `investigation.reviewed` handlers), call:

```ts
this.patientPush.sendToPatient(notification.patient_id, {
  title: notification.title,
  body: notification.description,
  navigate_to: notification.navigate_to,
  tag: notification.id,
});
```

Fire-and-forget: a push failure must never fail or delay notification creation.

### Frontend (`cradlen-patient`)

```
src/app/sw.ts                                   # + push / notificationclick handlers
src/app/api/patient-portal/push/
  subscribe/route.ts                            # -> proxyAuthenticatedPatientRequest
  unsubscribe/route.ts
src/features/push/
  lib/vapid.ts                                  # urlBase64ToUint8Array, key, isPushSupported()
  hooks/usePushSubscription.ts                  # state machine + enable/disable/resync
  components/PushNotificationProvider.tsx        # headless: SW message -> invalidate; resync on login
src/components/ui/switch.tsx                     # new shadcn primitive
src/features/patient-portal/components/profile/  # + Notifications section using the switch
src/components/Providers.tsx                     # mount PushNotificationProvider
next.config.ts + .env.example                   # NEXT_PUBLIC_VAPID_PUBLIC_KEY
src/messages/{en,ar}.json (or portal messages)  # new keys, en/ar parity
```

**Service worker** (`src/app/sw.ts`) — add `self.addEventListener("push", ...)` and
`"notificationclick"` **before** `serwist.addEventListeners()` (custom listeners
are bundled by `@serwist/turbopack`). Port the `cradlen-web` handlers:

- `push`: parse `event.data.json()` as `{title, body, navigate_to, tag}` (fallback
  title `"Cradlen"` on non-JSON); `showNotification(title, { body, icon/badge:
  "/icons/icon-192.png", tag, data: { navigate_to } })`; then `postMessage({ type:
  "cradlen:notification" })` to all window clients.
- `notificationclick`: `close()`, focus an existing client and `navigate(navigate_to
  ?? "/")`, else `openWindow(target)`.

To keep the handler unit-testable, extract the pure payload→NotificationOptions
mapping into a small function the SW imports and tests exercise directly.

**`usePushSubscription`** — port the `cradlen-web` state machine:
`status: "unsupported" | "default" | "denied" | "subscribed"`, `busy`, `supported`,
and `enable()` / `disable()` / `resync()`. `isPushSupported()` requires
serviceWorker + PushManager + Notification + a non-empty
`NEXT_PUBLIC_VAPID_PUBLIC_KEY`. `enable()` requests permission, subscribes with
`{ userVisibleOnly: true, applicationServerKey }`, and POSTs
`subscription.toJSON()` (`endpoint`, `keys.p256dh`, `keys.auth`) to
`/api/patient-portal/push/subscribe`. `disable()` unsubscribes locally and POSTs
`{ endpoint }` to `/unsubscribe`. `resync()` is silent, guarded by
`Notification.permission === "granted"`, and re-registers after login.

**`PushNotificationProvider`** — headless (renders `null`), mounted inside
`Providers` (has `queryClient`). Listens for `navigator.serviceWorker` `message`
events and invalidates `patientPortalQueryKeys.notifications()` (and the "all"
key) so the feed refreshes without polling; calls `resync()` when `usePatientMe()`
transitions to signed-in.

**Route handlers** — thin, following the existing pattern:

```ts
export async function POST(request: NextRequest) {
  return proxyAuthenticatedPatientRequest(request, "/patient-portal/push/subscribe");
}
```

**Profile Notifications section** — add a new shadcn `switch` primitive
(`src/components/ui/switch.tsx`) and a Notifications block in the profile screen
driven by `usePushSubscription`:

- `subscribed` → switch on, label "Notifications on"; toggling off calls `disable()`.
- `default` → switch off; toggling on calls `enable()` (triggers the permission
  prompt). Show a `busy` state ("Enabling…").
- `denied` → switch disabled + note to re-enable in browser settings.
- `unsupported` → section hidden.
- **Non-standalone iOS** → instead of the toggle, a hint ("Install Cradlen to your
  Home Screen to turn on notifications") with a button that opens the Phase 2
  `IosInstallSheet` (reuse `src/features/pwa/components/IosInstallSheet.tsx`).

**Wiring** — expose `NEXT_PUBLIC_VAPID_PUBLIC_KEY` via `next.config.ts` `env` and
`.env.example`. CSP needs no change (`worker-src 'self'` already set; subscribe is
same-origin). New i18n keys (`settings.notifications.*` or a `push.*` namespace)
with en/ar parity.

## Data Flow

1. **Enable:** profile toggle → `enable()` → permission prompt →
   `pushManager.subscribe(VAPID)` → POST `/api/patient-portal/push/subscribe` →
   proxy attaches token → backend upserts `PatientPushSubscription(account_id)`.
2. **Clinical event:** existing listener creates a `PatientNotification` →
   `sendToPatient(patient_id, payload)` → resolve self + guardian accounts → their
   subscriptions → `web-push` encrypted send.
3. **Delivery:** SW `push` handler shows the OS notification and posts
   `cradlen:notification` → open tabs invalidate and refresh the in-app feed.
4. **Click:** SW `notificationclick` focuses/opens a client and routes to
   `navigate_to`.
5. **Login resync:** `PushNotificationProvider` calls `resync()` (silent) so a
   returning patient's device re-registers without a prompt.

## Error Handling & Edge Cases

- **VAPID unset:** backend `pushConfig.enabled === false` → `sendToPatient` and
  `subscribe` no-op; frontend `isPushSupported()` → `false` → section hidden.
- **Stale subscriptions (404/410):** pruned via `deleteMany` by endpoint after a
  failed send.
- **Fire-and-forget dispatch:** wrapped so a push error never fails or delays
  `PatientNotification.create`.
- **Permission denied / revoked:** status `denied`; toggle disabled with guidance;
  `resync()` no-ops (guarded on `granted`).
- **Non-JSON / empty push:** SW falls back to title `"Cradlen"`.
- **Duplicate notifications across tabs:** `tag = notification.id` coalesces.
- **Account cascade:** deleting a `PatientAccount` cascades its subscriptions.
- **Shared device:** disabling in profile unsubscribes server-side; logging out
  leaves the browser subscription until disabled or the account is removed — same
  behavior as staff. (A future enhancement could purge on explicit logout; noted,
  not built here.)

## Localization

New keys (proposed `push` namespace or `settings.notifications.*`), en/ar parity
verified per `AGENTS.md`:

```
push.section.title
push.section.description
push.toggle.on
push.toggle.off
push.status.enabling
push.status.disabling
push.denied.note
push.ios.installHint
push.ios.installAction
```

Push **payload** copy (title/body) is produced by the backend at notification
creation and is already localized there — the SW does no i18n.

## Testing

- **Backend (jest):**
  - `PatientPushService.subscribe` upserts by endpoint; `unsubscribe` is
    account-scoped; `sendToPatient` fans out to self **and** guardian accounts and
    to all their subscriptions; 410/404 responses prune stale endpoints; service is
    inert when `pushConfig.enabled` is false.
  - Controller enforces `PatientJwtAuthGuard` and passes `accountId` + user-agent.
  - `PatientNotificationsListener` calls `sendToPatient` after `create()` for both
    event handlers, and a push failure does not throw out of the handler.
  - `migrate:check` passes with the new model + migration.
- **Frontend (vitest):**
  - `vapid.urlBase64ToUint8Array` round-trips; `isPushSupported()` matrix.
  - `usePushSubscription` state machine with mocked `navigator.serviceWorker`,
    `PushManager`, and `Notification` (default/denied/subscribed; enable/disable/
    resync; busy).
  - `PushNotificationProvider` invalidates the notifications query on a
    `cradlen:notification` message and resyncs on login transition.
  - Route handlers delegate to `proxyAuthenticatedPatientRequest` with the correct
    backend paths.
  - Profile Notifications section renders the correct control per status, and the
    non-standalone-iOS branch opens the install sheet.
  - SW payload→NotificationOptions mapping (extracted pure function).
- **E2E (Playwright):** documented gap — real `push` events cannot be reliably
  synthesized in Chromium, so delivery is not e2e-tested; the toggle UI states are
  covered by component tests. Do not silently skip.

## Critical Files

**cradlen-api:**
- `prisma/schema.prisma` (+ `PatientPushSubscription`, `PatientAccount` relation) + migration
- `src/core/patient-portal/push/{patient-push.service,patient-push.controller,patient-push.module}.ts`,
  `dto/patient-push.dto.ts`
- `src/core/patient-portal/notifications/patient-notifications.listener.ts` (inject + dispatch)
- app module registration

**cradlen-patient:**
- `src/app/sw.ts` (+ push/notificationclick + extracted mapper)
- `src/app/api/patient-portal/push/{subscribe,unsubscribe}/route.ts`
- `src/features/push/{lib/vapid,hooks/usePushSubscription,components/PushNotificationProvider}`
- `src/components/ui/switch.tsx`
- profile Notifications section under `src/features/patient-portal/components/profile/`
- `src/components/Providers.tsx`, `next.config.ts`, `.env.example`
- `src/messages/{en,ar}.json` (en/ar parity)
- colocated tests per house convention

## Verification

**Backend:** `npm run lint`, `npm run typecheck`/build, `npm test` (new push
suites), `migrate:check` all clean; generate the Prisma migration.

**Frontend:** `npm run lint`, `npx tsc --noEmit --pretty false`, `npm test`,
`npm run build` all clean; en/ar key parity verified.

**Manual (both running, `npm run dev` port 3200 + backend):**
- Generate VAPID keys (`npx web-push generate-vapid-keys`); set
  `VAPID_*` on the backend and the matching `NEXT_PUBLIC_VAPID_PUBLIC_KEY` on the
  frontend.
- Profile → enable notifications (permission prompt → subscribed). Confirm a row in
  `patient_push_subscriptions` for the account.
- Trigger a clinical event (visit completed / investigation reviewed) for the
  patient (and for a dependent under a guardian account) → the device receives an
  OS notification; the in-app feed refreshes; clicking routes to `navigate_to`.
- Disable → subscription removed; no further pushes.
- iOS Safari not installed → install hint opens the Phase 2 sheet.
- With VAPID unset → the Notifications section is hidden and the backend no-ops.

## Post-approval workflow note

After this spec is approved, invoke the writing-plans skill to produce the detailed
TDD implementation plan (backend slice first, then frontend), then execute it via
subagent-driven development, as in Phases 1–2.
