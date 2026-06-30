import createMiddleware from "next-intl/middleware";
import { NextRequest, NextResponse } from "next/server";
import { routing } from "./i18n/routing";
import {
  PATIENT_AUTH_REFRESH_TOKEN_COOKIE,
  PATIENT_AUTH_TOKEN_COOKIE,
} from "./infrastructure/auth-transport/constants";
import { isExpiredJwt } from "./infrastructure/auth-transport/jwt";

const intlMiddleware = createMiddleware(routing);

/**
 * Enforced, per-request-nonce CSP for document responses. `script-src` is
 * `'self' 'nonce-…'`: `'self'` allows Next's same-origin chunks (and the
 * same-origin Vercel analytics script on deploy), while the nonce is what permits
 * Next's inline hydration scripts — an injected inline script without the nonce is
 * blocked, which is the XSS defense. `'strict-dynamic'` is intentionally NOT used:
 * it disables `'self'` host-allowlisting and blocks Turbopack chunks that aren't
 * reached through the nonced loader chain. `style-src` keeps `'unsafe-inline'`
 * (Tailwind v4 + Next emit inline styles; CSP nonces don't cover style attributes).
 * Violations report to `/api/csp-report` via `report-to`/`report-uri`.
 */

/**
 * `connect-src` allowlist — the hosts the browser legitimately reaches via
 * fetch/XHR/WebSocket/beacon. Replaces a blanket `https:` (which let an injected
 * script exfiltrate to ANY https origin) with the exact set:
 *  - `'self'` — the same-origin `/api/*` proxy, Next HMR in dev, and the
 *    same-origin Vercel Analytics / Speed Insights beacons (`/_vercel/*`).
 *  - R2 — presigned PUT uploads go straight to the R2 S3 endpoint
 *    (`<account>.r2.cloudflarestorage.com`) for avatars and investigation results.
 *  - Sentry — error events post to the DSN's ingest host. Derived exactly from
 *    `NEXT_PUBLIC_SENTRY_DSN` so the region never has to be guessed, and omitted
 *    entirely when no DSN is configured.
 * NOTE: `img-src` deliberately keeps `https:` — presigned R2 GET URLs for avatars
 * and result files are loaded as images and their host can vary.
 */
function connectSrc(): string {
  const sources = ["'self'", "https://*.r2.cloudflarestorage.com"];
  const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN;
  if (dsn) {
    try {
      sources.push(`https://${new URL(dsn).host}`);
    } catch {
      // Malformed DSN → omit the host; never throw from CSP assembly.
    }
  }
  return `connect-src ${sources.join(" ")}`;
}

function buildCsp(nonce: string) {
  return [
    "default-src 'self'",
    "base-uri 'self'",
    "object-src 'none'",
    "frame-ancestors 'none'",
    "form-action 'self'",
    `script-src 'self' 'nonce-${nonce}'`,
    "worker-src 'self'",
    "manifest-src 'self'",
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: https:",
    "font-src 'self' https://fonts.gstatic.com data:",
    connectSrc(),
    "report-uri /api/csp-report",
    "report-to csp",
  ].join("; ");
}

// Patient portal sign-in / sign-up / recovery are reachable without a session.
const PATIENT_PUBLIC_PATHS = [
  "/patient/signin",
  "/patient/signup",
  "/patient/forgot-password",
];

function getPathWithoutLocale(pathname: string) {
  const segments = pathname.split("/");
  const maybeLocale = segments[1];

  if (routing.locales.includes(maybeLocale as (typeof routing.locales)[number])) {
    const path = `/${segments.slice(2).join("/")}`;
    return path === "/" ? "/" : path.replace(/\/$/, "");
  }

  return pathname === "/" ? "/" : pathname.replace(/\/$/, "");
}

function getLocale(pathname: string) {
  const maybeLocale = pathname.split("/")[1];

  return routing.locales.includes(maybeLocale as (typeof routing.locales)[number])
    ? maybeLocale
    : routing.defaultLocale;
}

function isProtectedPatientPath(pathWithoutLocale: string) {
  if (
    PATIENT_PUBLIC_PATHS.some(
      (p) => pathWithoutLocale === p || pathWithoutLocale.startsWith(p + "/"),
    )
  ) {
    return false;
  }

  return (
    pathWithoutLocale === "/patient" || pathWithoutLocale.startsWith("/patient/")
  );
}

export default function proxy(request: NextRequest) {
  const nonce = btoa(crypto.randomUUID());
  const csp = buildCsp(nonce);

  const pathWithoutLocale = getPathWithoutLocale(request.nextUrl.pathname);

  // Optimistic gate only — the backend remains the source of truth. An
  // unauthenticated portal visit lands on the patient sign-in.
  if (isProtectedPatientPath(pathWithoutLocale)) {
    const patientToken = request.cookies.get(PATIENT_AUTH_TOKEN_COOKIE)?.value;
    const patientRefresh = request.cookies.get(
      PATIENT_AUTH_REFRESH_TOKEN_COOKIE,
    )?.value;
    const hasPatientAccess =
      Boolean(patientToken && !isExpiredJwt(patientToken)) ||
      Boolean(patientRefresh);

    if (!hasPatientAccess) {
      const locale = getLocale(request.nextUrl.pathname);
      const redirect = NextResponse.redirect(
        new URL(`/${locale}/patient/signin`, request.url),
      );
      redirect.headers.set("Content-Security-Policy", csp);
      return redirect;
    }
  }

  // Propagate the nonce to the rendered page. Next reads the
  // `content-security-policy` REQUEST header to add `nonce="…"` to its own
  // scripts; the app can read `x-nonce` via `headers()`. next-intl copies the
  // request headers onto its rewrite/next response, so a header-augmented request
  // carries the nonce through to render. The response also carries the CSP so the
  // browser enforces it.
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-nonce", nonce);
  requestHeaders.set("Content-Security-Policy", csp);

  const response = intlMiddleware(
    new NextRequest(request, { headers: requestHeaders }),
  );
  response.headers.set("Content-Security-Policy", csp);
  return response;
}

export const config = {
  matcher: ["/((?!api|_next|_vercel|~offline|.*\\..*).*)"],
};
