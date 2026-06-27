import type { MessagesLoader } from "./I18nNamespace";
import type { NavItem } from "./NavItem";
import type { PermissionId, PermissionPredicate } from "./Permission";
import type { QueryKeyRoot } from "./QueryNamespace";

export type ModuleKind = "core" | "plugin";

/**
 * Declarative descriptor for a core module or plugin.
 *
 * Each module exports a manifest from its `manifest.ts` and a public
 * surface from its `api.ts`. The kernel registers manifests at boot.
 *
 * The manifest deliberately does **not** import from the module's
 * `api.ts`, because the api commonly re-exports React client components.
 * Pulling those in eagerly at boot would break server-side and test
 * environments. Callers reach an api via static `import "@/core/<name>/api"`
 * rather than via the kernel.
 */
export interface ModuleManifest {
  readonly id: string;
  readonly kind: ModuleKind;
  readonly i18nNamespace: string;
  readonly loadMessages: MessagesLoader;
  readonly nav: readonly NavItem[];
  readonly permissions: Readonly<Record<PermissionId, PermissionPredicate>>;
  readonly queryKeyRoot: QueryKeyRoot;
}
