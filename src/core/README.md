# core/

Domain modules. Each subfolder is a self-describing core module with a `manifest.ts` and a public `api.ts`.

Modules (Phase A: skeleton placeholders, populated by per-feature PRs):

- `auth/` — identity, sessions, profile selection.
- `org/` — organization entity.
- `branch/` — branch entity.
- `staff/` — pilot module (Phase C).
- `patient/` — patient entity.
- `clinical/` — `journey/`, `episode/`, `visit/`, `mmr/` (unified medical record aggregator).

Dependency rule: `core/ → common, infrastructure, builder, @/kernel (host hooks only)`. May not import from `plugins/`.

Module public surface contract: external code may import only from `@/core/<name>/api` or `@/core/<name>/manifest` or `@/core/<name>` (the barrel). Deep imports into a module's internals are blocked by ESLint.
