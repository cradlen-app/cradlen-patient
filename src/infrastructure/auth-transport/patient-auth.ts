import { cookies } from "next/headers";
import { NextResponse, type NextRequest } from "next/server";
import {
  AUTH_REFRESH_TOKEN_MAX_AGE,
  PATIENT_AUTH_REFRESH_TOKEN_COOKIE,
  PATIENT_AUTH_TOKEN_COOKIE,
  PATIENT_RESET_TOKEN_COOKIE,
  PATIENT_RESET_TOKEN_MAX_AGE,
  PATIENT_SIGNUP_TOKEN_COOKIE,
  PATIENT_SIGNUP_TOKEN_MAX_AGE,
} from "@/features/auth/lib/auth.constants";
import type { AuthTokens } from "@/features/auth/types/sign-in.types";
import {
  backendFetch,
  extractTokens,
  isExpiredJwt,
  readBackendJson,
} from "./backend";

const AUTH_COOKIE_OPTIONS = {
  httpOnly: true,
  path: "/",
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production",
};

// --- Cookie writers / clearers -------------------------------------------------

export function setPatientAuthCookies(response: NextResponse, tokens: AuthTokens) {
  response.cookies.set(PATIENT_AUTH_TOKEN_COOKIE, tokens.access_token, {
    ...AUTH_COOKIE_OPTIONS,
    maxAge: Math.max(0, tokens.expires_in),
  });
  response.cookies.set(PATIENT_AUTH_REFRESH_TOKEN_COOKIE, tokens.refresh_token, {
    ...AUTH_COOKIE_OPTIONS,
    maxAge: AUTH_REFRESH_TOKEN_MAX_AGE,
  });
}

export function clearPatientAuthCookies(response: NextResponse) {
  response.cookies.set(PATIENT_AUTH_TOKEN_COOKIE, "", {
    ...AUTH_COOKIE_OPTIONS,
    maxAge: 0,
  });
  response.cookies.set(PATIENT_AUTH_REFRESH_TOKEN_COOKIE, "", {
    ...AUTH_COOKIE_OPTIONS,
    maxAge: 0,
  });
  clearPatientSignupTokenCookie(response);
}

export function setPatientSignupTokenCookie(
  response: NextResponse,
  token: string,
  maxAge = PATIENT_SIGNUP_TOKEN_MAX_AGE,
) {
  response.cookies.set(PATIENT_SIGNUP_TOKEN_COOKIE, token, {
    ...AUTH_COOKIE_OPTIONS,
    maxAge: Math.max(0, maxAge),
  });
}

export function clearPatientSignupTokenCookie(response: NextResponse) {
  response.cookies.set(PATIENT_SIGNUP_TOKEN_COOKIE, "", {
    ...AUTH_COOKIE_OPTIONS,
    maxAge: 0,
  });
}

export async function getPatientSignupTokenFromRequest(
  body?: Record<string, unknown>,
) {
  const cookieStore = await cookies();
  const cookieToken = cookieStore.get(PATIENT_SIGNUP_TOKEN_COOKIE)?.value;
  const bodyToken = body?.patient_signup_token;
  const requestToken =
    typeof bodyToken === "string" && bodyToken.trim() ? bodyToken : null;

  return requestToken ?? cookieToken ?? null;
}

export function setPatientResetTokenCookie(
  response: NextResponse,
  token: string,
  maxAge = PATIENT_RESET_TOKEN_MAX_AGE,
) {
  response.cookies.set(PATIENT_RESET_TOKEN_COOKIE, token, {
    ...AUTH_COOKIE_OPTIONS,
    maxAge: Math.max(0, maxAge),
  });
}

export function clearPatientResetTokenCookie(response: NextResponse) {
  response.cookies.set(PATIENT_RESET_TOKEN_COOKIE, "", {
    ...AUTH_COOKIE_OPTIONS,
    maxAge: 0,
  });
}

export async function getPatientResetTokenFromRequest(
  body?: Record<string, unknown>,
) {
  const cookieStore = await cookies();
  const cookieToken = cookieStore.get(PATIENT_RESET_TOKEN_COOKIE)?.value;
  const bodyToken = body?.reset_token;
  const requestToken =
    typeof bodyToken === "string" && bodyToken.trim() ? bodyToken : null;

  return requestToken ?? cookieToken ?? null;
}

// --- Refresh -------------------------------------------------------------------

const inflightRefreshes = new Map<string, Promise<AuthTokens>>();

async function performPatientRefresh(refreshToken: string): Promise<AuthTokens> {
  const response = await backendFetch("/patient-auth/refresh", {
    method: "POST",
    body: JSON.stringify({ refresh_token: refreshToken }),
  });
  const body = await readBackendJson(response);
  const tokens = response.ok ? extractTokens(body) : null;

  if (!tokens) {
    throw new Error("Patient token refresh failed");
  }

  return tokens;
}

function refreshPatientTokens(refreshToken: string) {
  const existing = inflightRefreshes.get(refreshToken);
  if (existing) return existing;

  const promise = performPatientRefresh(refreshToken).finally(() => {
    inflightRefreshes.delete(refreshToken);
  });
  inflightRefreshes.set(refreshToken, promise);
  return promise;
}

/**
 * Returns a usable patient access token, transparently rotating an expired one
 * via the refresh cookie. `refreshedTokens` is non-null when a rotation happened
 * and the caller should re-persist the new pair onto its response.
 */
export async function getValidPatientAccessToken(): Promise<{
  accessToken: string | null;
  refreshedTokens: AuthTokens | null;
}> {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get(PATIENT_AUTH_TOKEN_COOKIE)?.value;
  const refreshToken = cookieStore.get(PATIENT_AUTH_REFRESH_TOKEN_COOKIE)?.value;

  if (accessToken && !isExpiredJwt(accessToken)) {
    return { accessToken, refreshedTokens: null };
  }

  if (!refreshToken) {
    return { accessToken: null, refreshedTokens: null };
  }

  try {
    const refreshedTokens = await refreshPatientTokens(refreshToken);
    return { accessToken: refreshedTokens.access_token, refreshedTokens };
  } catch {
    return { accessToken: null, refreshedTokens: null };
  }
}

/**
 * Read-only check for a usable patient session, for server components (e.g. the
 * portal layout) that cannot persist rotated cookies. Deliberately does NOT
 * refresh: a valid access token, or a refresh cookie (which the API routes will
 * spend), is enough. Mirrors the proxy's `hasPatientAccess`.
 */
export async function hasPatientSessionCookies(): Promise<boolean> {
  const cookieStore = await cookies();
  const access = cookieStore.get(PATIENT_AUTH_TOKEN_COOKIE)?.value;
  const refresh = cookieStore.get(PATIENT_AUTH_REFRESH_TOKEN_COOKIE)?.value;
  return Boolean((access && !isExpiredJwt(access)) || refresh);
}

// --- Authenticated backend proxy ----------------------------------------------

/**
 * Forwards a request to the backend with the patient's access token, rotating it
 * via the refresh cookie when expired. The single guard behind every patient
 * data route — mirrors the staff `proxyAuthenticatedRequest`, minus the
 * selection-token / org-header machinery patients don't have.
 */
export async function proxyAuthenticatedPatientRequest(
  request: NextRequest,
  backendPath: string,
) {
  const body = ["GET", "HEAD"].includes(request.method)
    ? undefined
    : await request.arrayBuffer();

  const { accessToken, refreshedTokens } = await getValidPatientAccessToken();
  if (!accessToken) {
    const res = NextResponse.json(
      { message: "Authentication required" },
      { status: 401 },
    );
    clearPatientAuthCookies(res);
    return res;
  }

  const backendResponse = await backendFetch(backendPath, {
    method: request.method,
    headers: { Authorization: `Bearer ${accessToken}` },
    body,
  });

  const res =
    backendResponse.status === 204
      ? new NextResponse(null, { status: 204 })
      : NextResponse.json(await readBackendJson(backendResponse), {
          status: backendResponse.status,
        });

  if (refreshedTokens) setPatientAuthCookies(res, refreshedTokens);
  if (backendResponse.status === 401) clearPatientAuthCookies(res);
  return res;
}

// --- Token-issuing response helpers -------------------------------------------

function passthroughError(body: unknown, response: Response) {
  return NextResponse.json(body ?? { message: response.statusText }, {
    status: response.status,
  });
}

const AUTHENTICATED = { data: { authenticated: true }, meta: {} };

export async function patientLoginResponse(request: Request) {
  const response = await backendFetch("/patient-auth/login", {
    method: "POST",
    body: await request.arrayBuffer(),
  });
  const body = await readBackendJson(response);

  if (!response.ok) return passthroughError(body, response);

  const tokens = extractTokens(body);
  if (!tokens) return passthroughError(body, response);

  const frontendResponse = NextResponse.json(AUTHENTICATED, { status: 200 });
  setPatientAuthCookies(frontendResponse, tokens);
  return frontendResponse;
}

export async function patientSignupStartResponse(request: Request) {
  const response = await backendFetch("/patient-auth/signup/start", {
    method: "POST",
    body: await request.arrayBuffer(),
  });
  const body = await readBackendJson(response);

  if (!response.ok) return passthroughError(body, response);

  const root =
    body && typeof body === "object"
      ? (body as Record<string, unknown>)
      : null;
  const data =
    root?.data && typeof root.data === "object"
      ? (root.data as Record<string, unknown>)
      : null;
  const token = data?.patient_signup_token;
  const expiresIn =
    typeof data?.expires_in === "number" ? data.expires_in : undefined;

  const frontendResponse = NextResponse.json(
    { data: { expires_in: expiresIn ?? null }, meta: {} },
    { status: 200 },
  );

  if (typeof token === "string" && token.trim()) {
    setPatientSignupTokenCookie(frontendResponse, token, expiresIn);
  }

  return frontendResponse;
}

export async function patientSignupCompleteResponse(request: Request) {
  const body = (await request.json().catch(() => ({}))) as Record<
    string,
    unknown
  >;
  const signupToken = await getPatientSignupTokenFromRequest(body);

  if (!signupToken) {
    return NextResponse.json(
      { message: "Your sign-up session expired. Please start again." },
      { status: 401 },
    );
  }

  const payload = {
    patient_signup_token: signupToken,
    password: body.password,
    confirm_password: body.confirm_password,
    security_question: body.security_question,
    security_answer: body.security_answer,
  };
  const response = await backendFetch("/patient-auth/signup/complete", {
    method: "POST",
    body: JSON.stringify(payload),
  });
  const responseBody = await readBackendJson(response);

  if (!response.ok) return passthroughError(responseBody, response);

  const tokens = extractTokens(responseBody);
  if (!tokens) return passthroughError(responseBody, response);

  const frontendResponse = NextResponse.json(AUTHENTICATED, { status: 201 });
  setPatientAuthCookies(frontendResponse, tokens);
  clearPatientSignupTokenCookie(frontendResponse);
  return frontendResponse;
}

export async function patientForgotPasswordStartResponse(request: Request) {
  const response = await backendFetch("/patient-auth/forgot-password/start", {
    method: "POST",
    body: await request.arrayBuffer(),
  });
  const body = await readBackendJson(response);

  if (!response.ok) return passthroughError(body, response);

  const root =
    body && typeof body === "object"
      ? (body as Record<string, unknown>)
      : null;
  const data =
    root?.data && typeof root.data === "object"
      ? (root.data as Record<string, unknown>)
      : null;
  const token = data?.reset_token;
  const securityQuestion = data?.security_question;
  const expiresIn =
    typeof data?.expires_in === "number" ? data.expires_in : undefined;

  const frontendResponse = NextResponse.json(
    {
      data: {
        security_question:
          typeof securityQuestion === "string" ? securityQuestion : null,
        expires_in: expiresIn ?? null,
      },
      meta: {},
    },
    { status: 200 },
  );

  // The reset token is httpOnly-cookie'd, never returned to client JS.
  if (typeof token === "string" && token.trim()) {
    setPatientResetTokenCookie(frontendResponse, token, expiresIn);
  }

  return frontendResponse;
}

export async function patientForgotPasswordCompleteResponse(request: Request) {
  const body = (await request.json().catch(() => ({}))) as Record<
    string,
    unknown
  >;
  const resetToken = await getPatientResetTokenFromRequest(body);

  if (!resetToken) {
    return NextResponse.json(
      { message: "Your reset session expired. Please start again." },
      { status: 401 },
    );
  }

  const payload = {
    reset_token: resetToken,
    security_answer: body.security_answer,
    password: body.password,
    confirm_password: body.confirm_password,
  };
  const response = await backendFetch("/patient-auth/forgot-password/complete", {
    method: "POST",
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const responseBody = await readBackendJson(response);
    return passthroughError(responseBody, response);
  }

  // Backend returns 204; no auto-login — the patient signs in with the new
  // password. Clear the spent reset token.
  const frontendResponse = NextResponse.json(
    { data: { reset: true }, meta: {} },
    { status: 200 },
  );
  clearPatientResetTokenCookie(frontendResponse);
  return frontendResponse;
}
