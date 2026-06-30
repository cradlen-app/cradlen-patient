# Releasing & Versioning

How cradlen-patient (the patient portal) is versioned, deployed, and rolled back.
This repo and its Vercel project are **independent** of cradlen-web — they carry
separate version lines that need not match.

## What versions what

- **Portal app version** — the frontend deployable, tracked by `package.json`
  `version` (semver), owned by **release-please**. Shown in the footer as `v1.0.0`
  (the short commit is in the hover tooltip).
- **API version** (`/v1` in `NEXT_PUBLIC_API_URL`) — the shared backend REST
  contract, versioned separately on the API side. Independent of this version.

## Cutting a release (fully automated)

Releases are derived from [Conventional Commits](https://www.conventionalcommits.org/)
on `main`. Engineers never hand-edit the version or changelog.

1. Merge feature/fix PRs into `main` as usual (`feat:`, `fix:`, `feat!:` /
   `BREAKING CHANGE:` drive the bump: minor / patch / major).
2. **release-please** (`.github/workflows/release-please.yml`) keeps an open
   **"chore(main): release X.Y.Z"** PR up to date with the next version + generated
   `CHANGELOG.md`.
3. **Cut the release**: merge that Release PR. This bumps `package.json`, updates
   `CHANGELOG.md`, tags `vX.Y.Z`, and creates the GitHub Release.
4. **Deploy**: the bump commit on `main` triggers Vercel's production deploy
   automatically. The new version is baked into the build and appears in the footer.

> First release is seeded at **1.0.0** (`.release-please-manifest.json` + `package.json`).
> To force a specific version out of band, add a `Release-As: X.Y.Z` footer to a commit on `main`.

## Build identity

`next.config.ts` bakes build metadata into the bundle (`NEXT_PUBLIC_APP_VERSION`,
`NEXT_PUBLIC_BUILD_ID` = commit SHA, etc.), read via `@/infrastructure/config/build-info`.
`GET /api/version` reports the **live** deployment's identity (no-store). The client
(`useVersionCheck` → `UpdateBanner`) polls it and prompts signed-in patients to refresh
when the live build id differs from the one baked into their tab. It never auto-reloads.

> Requires Vercel's "Automatically expose System Environment Variables" to stay
> enabled (default on) so `VERCEL_GIT_COMMIT_SHA` reaches the build. If it's off,
> a deploy still gets a unique non-`dev` build id, so update detection keeps working.

## Promote a preview to production

Every PR gets a Vercel Preview. To ship a specific build without a new commit:

- Vercel → Deployments → pick the deployment → **Promote to Production**, or
- `vercel promote <deployment-url>`

## Instant rollback

To revert production to a previous good build (no rebuild, seconds):

- Vercel → Deployments → the last-known-good production deployment → **Instant Rollback**, or
- `vercel rollback <deployment-url>`

After rollback, `/api/version` reports the rolled-back build id, so open patient tabs
running the bad build will correctly see the update prompt.

## Tag ↔ deployment mapping

Each GitHub Release `vX.Y.Z` corresponds to the Vercel deployment built from that
release's commit SHA (visible in the deployment's Git metadata). Use the SHA to
correlate a tag to a deployment when promoting or rolling back.
