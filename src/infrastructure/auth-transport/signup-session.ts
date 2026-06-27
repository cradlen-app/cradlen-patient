import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { SIGNUP_TOKEN_COOKIE } from "@/features/auth/lib/auth.constants";
import {
  clearSignupTokenCookie,
  setSignupTokenCookie,
} from "@/infrastructure/auth-transport/backend";

function getObject(value: unknown) {
  return value && typeof value === "object"
    ? (value as Record<string, unknown>)
    : null;
}

export function extractSignupToken(body: unknown) {
  const root = getObject(body);
  const data = getObject(root?.data);
  const source = data ?? root;
  const token = source?.signup_token ?? source?.registration_token;

  return typeof token === "string" && token.trim() ? token : null;
}

export function extractSignupTokenMaxAge(body: unknown) {
  const root = getObject(body);
  const data = getObject(root?.data);
  const source = data ?? root;
  const expiresIn = source?.expires_in;

  return typeof expiresIn === "number" ? expiresIn : undefined;
}

export function sanitizeSignupTokenResponse(body: unknown) {
  const root = getObject(body);
  const data = getObject(root?.data);

  if (data) {
    const safeData = { ...data };
    delete safeData.signup_token;
    delete safeData.registration_token;
    return { ...root, data: safeData };
  }

  if (root) {
    const safeRoot = { ...root };
    delete safeRoot.signup_token;
    delete safeRoot.registration_token;
    return safeRoot;
  }

  return body;
}

export async function getSignupTokenFromRequest(body?: Record<string, unknown>) {
  const cookieStore = await cookies();
  const cookieToken = cookieStore.get(SIGNUP_TOKEN_COOKIE)?.value;
  const bodyToken = body?.signup_token ?? body?.registration_token;

  const requestToken =
    typeof bodyToken === "string" && bodyToken.trim() ? bodyToken : null;

  return requestToken ?? cookieToken ?? null;
}

export function persistSignupTokenFromBody(
  response: NextResponse,
  body: unknown,
) {
  const token = extractSignupToken(body);

  if (token) {
    setSignupTokenCookie(response, token, extractSignupTokenMaxAge(body));
  }
}

export function clearSignupToken(response: NextResponse) {
  clearSignupTokenCookie(response);
}
