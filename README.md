# Cradlen Patient

The standalone **patient portal** for Cradlen — a Next.js 16 App Router app where
patients (and their dependents) view their health record, visits, medications, lab
tests, care journey, and notifications, and upload documents to their clinic.

It was extracted from `cradlen-web` (the clinic/staff dashboard) into its own repo
and domain. Both apps talk to the same backend, `cradlen-api`. Patient auth is
fully separate from staff auth (its own `HttpOnly` cookies and proxy), so the two
apps share no session.

## Stack

- Next.js 16 (App Router) · React 19 · TypeScript
- Tailwind CSS v4 (`src/styles/globals.css`) · shadcn-style UI (`radix-ui`) · Lucide
- next-intl (`en` / `ar`, RTL) · TanStack Query · Zustand · React Hook Form + Zod

## Getting started

```bash
npm install
cp .env.example .env.local   # then set NEXT_PUBLIC_API_URL / API_BASE_URL
npm run dev                  # http://localhost:3200
```

## Scripts

```bash
npm run dev      # dev server on port 3200 (Turbopack)
npm run build    # production build
npm run start    # serve the production build on port 3200
npm run lint     # ESLint
npm run test     # Vitest
```

Requires Node.js 20+.

## Layout

- `src/app/[locale]/patient/` — portal pages (`(portal)` group) + auth pages
  (`signin`, `signup`, `forgot-password`).
- `src/app/api/patient-portal/*`, `src/app/api/patient-auth/*` — same-origin proxy
  route handlers that attach the patient token server-side.
- `src/core/patient-portal/` — the portal feature module (components, hooks, data,
  types, messages).
- `src/components/{ui,common,layout}` — shadcn primitives + the patient app shell
  (`PatientDashboardLayout`, `PatientNavbar`, `PatientSidebar`, `PatientBottomTabs`).
- `src/infrastructure/{http,auth-transport,query}` and `src/i18n/*` — shared
  infrastructure **copied** from `cradlen-web`.

## Shared-code drift

Shared infrastructure (auth-transport, http client, i18n setup, brand tokens) is
**copied, not packaged**. When you change auth/refresh behavior or brand tokens
here, mirror it in `cradlen-web` (and vice-versa). See `AGENTS.md`.
