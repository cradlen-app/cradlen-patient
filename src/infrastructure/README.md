# infrastructure/

Implementations that talk to the outside world. Mirrors `cradlen-api/src/infrastructure/` but adapted to the browser runtime.

Subfolders (filled by Phase B):

- `http/` — `apiAuthFetch` and route builders (moves from `src/lib/api.ts`, `src/lib/routes.ts`).
- `query/` — `QueryClient` singleton + provider (moves from `src/lib/queryClient.ts`).
- `realtime/` — socket.io factory (absorbs visits' socket bootstrap).
- `auth-transport/` — `/api/auth/*` clients; HttpOnly cookie bridge (moves from `src/lib/server/*`).
- `i18n/` — `mergeMessages(locale, registry)` and namespace loader plumbing.
- `storage/` — cookie helpers; no `localStorage` token storage allowed.
- `logging/` — console + Sentry adapter.
- `monitoring/` — web-vitals + error boundary plumbing.
- `config/` — `NEXT_PUBLIC_*` env reader, feature flags.

Dependency rule: `infrastructure/ → common`. Nothing else.
