/**
 * Build identity, baked into the bundle at build time by `next.config.ts` via the
 * `env` map. This is the single typed seam the rest of the app reads — components
 * import `BUILD_INFO` rather than touching `process.env.NEXT_PUBLIC_*` directly.
 *
 * Values are inlined at build, so this is safe to import from client components.
 * The live deployment's identity (for update detection) comes from `/api/version`
 * at runtime; this module is the *baked-in* counterpart it gets compared against.
 */
export const BUILD_INFO = {
  /** Semver from package.json (release-please owned). */
  version: process.env.NEXT_PUBLIC_APP_VERSION ?? "0.0.0",
  /** Commit SHA on Vercel, or a `dev-*` sentinel locally. */
  buildId: process.env.NEXT_PUBLIC_BUILD_ID ?? "dev",
  /** Full commit SHA (empty outside Vercel). */
  commit: process.env.NEXT_PUBLIC_COMMIT_SHA ?? "",
  /** Git ref (branch) the deploy was built from. */
  ref: process.env.NEXT_PUBLIC_GIT_REF ?? "",
  /** ISO timestamp of the build. */
  builtAt: process.env.NEXT_PUBLIC_BUILT_AT ?? "",
} as const;

/** Short 7-char commit for compact display; empty when no commit is available. */
export const shortCommit = BUILD_INFO.commit.slice(0, 7);

/** True for a local/dev build where the build id is a non-deploy sentinel. */
export const isDevBuild =
  BUILD_INFO.buildId === "dev" || BUILD_INFO.buildId.startsWith("dev-");
