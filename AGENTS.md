<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Cradlen Patient — Agent Memory

The standalone patient portal frontend. Patients (and their dependents) view their
health record, visits, medications, lab tests, journey, and notifications, and
upload documents to their clinic. Extracted from `cradlen-web`; the clinic/staff
dashboard lives in that separate repo. Backend is the shared `cradlen-api`.

## Project Snapshot

- Next.js 16 App Router, React 19, TypeScript.
- Tailwind CSS v4 via `src/styles/globals.css` (no `tailwind.config.js`).
- i18n: `next-intl` with English (`en`) and Arabic (`ar`); RTL for `ar`.
- UI: shadcn-style components (`radix-ui`), Lucide icons, React Hook Form, Zod,
  TanStack Query, Zustand.
- Path alias `@/*` → `src/*` (plus `@/common/*`, `@/infrastructure/*`).
- Dev server runs on port **3200** (`npm run dev`).

## Next.js 16 Rules

- Middleware is `src/proxy.ts`, not `middleware.ts`. It only optimistically gates
  `/patient/*` behind the patient session — the backend remains the source of truth.
- Route/page/layout `params` are promises — await them before reading values.
- Route handlers live in `route.ts`; `cookies()` from `next/headers` is async.

## Auth And API Rules

- Patient auth is **flat** (not org/branch scoped) and separate from staff.
- Do not store access/refresh tokens in Zustand, localStorage, sessionStorage, or
  readable cookies. They are owned by Next route handlers as `HttpOnly` cookies:
  - `cradlen-patient-token`
  - `cradlen-patient-refresh-token`
- Authenticated browser calls go through same-origin route handlers under
  `/api/patient-portal/*` and `/api/patient-auth/*`, which attach the patient
  token server-side. The client helper is `apiFetch` from
  `@/infrastructure/http/api` — a plain credentialed fetch; there is NO
  multi-tenant header injection here.
- Token-issuing flows go through local handlers that set cookies and return only
  non-sensitive session state: `/api/patient-auth/{login,signup/start,signup/complete,
  forgot-password/*,logout,me}`.
- Backend base URL comes from `API_BASE_URL` or `NEXT_PUBLIC_API_URL`
  (fallback `https://api.cradlen.com/v1`).

## Localization Rules

- All pages live under `src/app/[locale]/`. Call `setRequestLocale(locale)` in any
  page/layout receiving locale params.
- Server translations: `getTranslations(...)`; client: `useTranslations(...)`.
- Navigation: use `Link`/`redirect`/`useRouter` from `@/i18n/navigation`.
  `useSearchParams` still comes from `next/navigation`.
- Base messages live in `src/messages/{en,ar}.json`; the portal's own keys live in
  `src/features/patient-portal/messages/{en,ar}.json` and are merged under the
  `patientPortal` namespace in `src/i18n/request.ts`. Keep en/ar keys in parity.
- Use logical Tailwind utilities (`ms-`, `me-`, `ps-`, `pe-`) and RTL/LTR variants.

## Layout And UI Rules

- Portal pages use `PatientDashboardLayout` (`src/components/layout/`): responsive
  bottom tabs on mobile, sidebar on desktop.
- Portal screens should fill full width/height — not centered `max-w-2xl`.
- Use `cn()` from `@/common/utils/utils` for conditional class names.
- shadcn primitives live in `src/components/ui/`; extend with care.

## PWA / Service-worker caching (IMPORTANT)

The app is an installable PWA (Serwist SW at `src/app/sw.ts`, manifest at
`src/app/manifest.ts`). This is a health app used on shared/family devices, so:

- Authenticated patient API responses are **never** cached. A `NetworkOnly` guard
  keyed on `isPatientApiPath` (`src/app/sw-routes.ts`) is registered **before**
  `defaultCache` in the SW's `runtimeCaching` (route matching is first-match-wins).
- `defaultCache` still caches page **HTML and RSC payloads** for `/patient/*`
  routes. This is PHI-safe **only** because every portal screen is a
  **client-rendered shell** — PHI arrives via the guarded `/api/patient-portal/*`
  client calls, never in the server-rendered document. **Do not server-render any
  patient datum into a `/patient/*` page**; if you must, add an explicit
  `NetworkOnly` guard for that route, or it will land in Cache Storage and survive
  logout on a shared device.

## Shared-Code Drift (IMPORTANT)

This repo was split from `cradlen-web` with shared code **copied, not packaged**.
The duplicated layer — `src/infrastructure/http`, `src/i18n/*`,
`src/styles/globals.css` brand tokens — has an independent copy in `cradlen-web`.
When you change brand tokens or the `http` transport here, mirror it there (and
vice-versa). There is no shared package to keep them in sync automatically.

**Exception — `src/infrastructure/auth-transport` is intentionally patient-only.**
It was deliberately trimmed: the staff role taxonomy, multi-tenant/selection-token
proxy, and staff cookies that came over in the original copy were removed, and
the auth constants/types now live in `auth-transport/{constants,types}.ts` (no
longer imported up from `features/auth`). Do NOT re-sync this folder from
`cradlen-web` wholesale — port only the patient-relevant changes (refresh/rotation
logic, cookie security, the backend SSRF/path guards).

## Verification

- Before handing off meaningful changes, run `npm run lint` and `npm run build`.
- Use `npx tsc --noEmit --pretty false` for a faster TypeScript signal.
- If adding translation keys, verify English and Arabic key parity.
