# common/

Foundation layer. No imports from anywhere else in `src/`.

Houses:

- `types/` — shared TypeScript types (DTOs, domain primitives).
- `utils/` — pure helpers (`cn`, formatters, guards).
- `errors/` — error classes and discriminated unions.
- `constants/` — environment-agnostic constants.
- `kernel-contracts/` — pure type interfaces (`ModuleManifest`, `NavItem`, `Permission`, `AuthContext`). Importable by every layer including `plugins/`.

Dependency rule: `common/ → nothing in src/`.
