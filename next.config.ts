import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs";
import createNextIntlPlugin from "next-intl/plugin";
import pkg from "./package.json";

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

// Build identity, baked into the browser bundle so the running tab knows which
// deployment it is. On Vercel the commit SHA is the stable, meaningful id.
// `VERCEL_*` system vars are NOT `NEXT_PUBLIC_`, so they must be re-exported via
// the `env` map below to be readable client-side.
//
// Robustness: if the commit SHA is missing (e.g. Vercel's "Automatically expose
// System Environment Variables" is off), we must NOT silently fall back to a
// `dev-*` id in a real deploy — that would disable update detection in prod. So
// only a genuine local build gets a `dev-*` sentinel; any CI/Vercel build gets a
// unique, non-dev `build-*` id so each deploy is still detectable as new.
const commitSha = process.env.VERCEL_GIT_COMMIT_SHA ?? "";
const isCIBuild = process.env.VERCEL === "1" || process.env.CI === "1";
const buildId =
  commitSha || (isCIBuild ? `build-${Date.now()}` : `dev-${Date.now()}`);

/**
 * Static security headers applied to every route (incl. /api). The
 * Content-Security-Policy itself is NOT set here — it is emitted per-request by
 * the middleware (`src/proxy.ts`) so each document gets a fresh `script-src`
 * nonce. `Reporting-Endpoints` stays here so the middleware CSP's `report-to`
 * directive resolves to the collection route on every response.
 */
const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Strict-Transport-Security",
    value: "max-age=31536000; includeSubDomains",
  },
  { key: "Reporting-Endpoints", value: 'csp="/api/csp-report"' },
];

const nextConfig: NextConfig = {
  // Use the commit SHA as the build id so it lines up with `/api/version`.
  generateBuildId: async () => buildId,
  // Build metadata exposed to the browser (read via `@/infrastructure/config/
  // build-info`). Vercel runs `npm run build`, so `npm_package_version` is the
  // version release-please writes into package.json.
  env: {
    NEXT_PUBLIC_APP_VERSION: process.env.npm_package_version ?? pkg.version,
    NEXT_PUBLIC_BUILD_ID: buildId,
    NEXT_PUBLIC_COMMIT_SHA: commitSha,
    NEXT_PUBLIC_GIT_REF: process.env.VERCEL_GIT_COMMIT_REF ?? "",
    NEXT_PUBLIC_BUILT_AT: new Date().toISOString(),
  },
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
};

// Source-map upload runs only when SENTRY_AUTH_TOKEN is present (CI/Vercel), so
// local and token-less builds are not slowed or failed by the Sentry plugin.
// `org`/`project` target the SaaS project; the runtime DSN comes from env.
export default withSentryConfig(withNextIntl(nextConfig), {
  org: "cradlen",
  project: "cradlen-patient",
  silent: !process.env.CI,
  telemetry: false,
  widenClientFileUpload: true,
  sourcemaps: { disable: !process.env.SENTRY_AUTH_TOKEN },
});
