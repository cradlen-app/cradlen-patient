import createMiddleware from "next-intl/middleware";
import { NextResponse, type NextRequest } from "next/server";
import { routing } from "./i18n/routing";
import {
  PATIENT_AUTH_REFRESH_TOKEN_COOKIE,
  PATIENT_AUTH_TOKEN_COOKIE,
} from "./features/auth/lib/auth.constants";
import { isExpiredJwt } from "./infrastructure/auth-transport/jwt";

const intlMiddleware = createMiddleware(routing);

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
      return NextResponse.redirect(
        new URL(`/${locale}/patient/signin`, request.url),
      );
    }
  }

  return intlMiddleware(request);
}

export const config = {
  matcher: ["/((?!api|_next|_vercel|.*\\..*).*)"],
};
