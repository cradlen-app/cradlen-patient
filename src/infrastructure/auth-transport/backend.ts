import { DEFAULT_AUTH_EXPIRES_IN } from "./constants";
import { isExpiredJwt } from "./jwt";
import type { AuthTokens } from "./types";

/**
 * Resolves the backend base URL and, in production, refuses an untrusted target.
 * The patient access/refresh tokens are attached to every backend call, so a
 * tampered `API_BASE_URL` would exfiltrate them to an attacker origin. We fail
 * closed at module load rather than silently leak. Non-production stays
 * permissive (localhost / test backends over http are fine).
 */
function resolveApiBaseUrl(): string {
  const raw = (
    process.env.API_BASE_URL ??
    process.env.NEXT_PUBLIC_API_URL ??
    "https://api.cradlen.com/v1"
  ).replace(/\/+$/, "");

  if (process.env.NODE_ENV === "production") {
    let url: URL;
    try {
      url = new URL(raw);
    } catch {
      throw new Error(`Invalid API base URL: ${raw}`);
    }
    if (url.protocol !== "https:") {
      throw new Error(`API base URL must use https in production (got ${raw})`);
    }
    if (url.hostname !== "cradlen.com" && !url.hostname.endsWith(".cradlen.com")) {
      throw new Error(
        `Refusing untrusted API base host in production: ${url.hostname}`,
      );
    }
  }

  return raw;
}

export const API_BASE_URL = resolveApiBaseUrl();

/**
 * Joins a backend-relative path to {@link API_BASE_URL}. Rejects paths that could
 * escape the API origin or traverse out of the intended endpoint:
 *  - protocol-relative (`//evil.com`) or scheme-smuggling (`/https://…`) targets
 *  - `..` path segments
 * The query string (after `?`) is left untouched. Callers must additionally
 * `encodeURIComponent` any dynamic path segment so a value can never inject a
 * new segment or `..`.
 */
export function backendUrl(path: string) {
  const normalized = path.startsWith("/") ? path : `/${path}`;
  const [pathname] = normalized.split("?");

  const unsafe =
    pathname.startsWith("//") ||
    /^\/[a-z][a-z0-9+.-]*:/i.test(pathname) ||
    pathname.split("/").includes("..");

  if (unsafe) {
    throw new Error(`Unsafe backend path rejected: ${pathname}`);
  }

  return `${API_BASE_URL}${normalized}`;
}

// Re-exported from the shared, dependency-free helper so existing
// `@/infrastructure/auth-transport/backend` importers keep working while the
// implementation (and clock-skew leeway) lives in one place.
export { isExpiredJwt };

export function extractTokens(body: unknown): AuthTokens | null {
  if (!body || typeof body !== "object") return null;

  const maybeWrapped = body as { data?: unknown };
  const tokenSource =
    maybeWrapped.data && typeof maybeWrapped.data === "object"
      ? maybeWrapped.data
      : body;
  const maybeTokens = tokenSource as Partial<AuthTokens>;

  if (
    typeof maybeTokens.access_token !== "string" ||
    typeof maybeTokens.refresh_token !== "string"
  ) {
    return null;
  }

  return {
    access_token: maybeTokens.access_token,
    refresh_token: maybeTokens.refresh_token,
    token_type: maybeTokens.token_type ?? "Bearer",
    expires_in: maybeTokens.expires_in ?? DEFAULT_AUTH_EXPIRES_IN,
  };
}

export async function backendFetch(path: string, init?: RequestInit) {
  return fetch(backendUrl(path), {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...init?.headers,
    },
  });
}

export async function readBackendJson(response: Response) {
  const text = await response.text();
  if (!text) return null;

  try {
    return JSON.parse(text) as unknown;
  } catch {
    return text;
  }
}

/**
 * Strips internal detail out of a backend error before it is forwarded to the
 * browser. 5xx bodies are collapsed to a generic message (they can carry stack
 * traces / internal paths); 4xx bodies surface only a user-facing `message` and
 * an optional `{ field, message }[]` validation list that the forms rely on.
 * Anything else (internal keys, raw text) is dropped. Always log the full body
 * server-side before calling this.
 */
export function sanitizeBackendError(
  body: unknown,
  status: number,
): Record<string, unknown> {
  if (status >= 500) {
    return { message: "Something went wrong. Please try again." };
  }

  const fallback = "Request failed.";
  if (!body || typeof body !== "object") return { message: fallback };

  const b = body as Record<string, unknown>;
  const out: Record<string, unknown> = {};

  if (typeof b.message === "string") {
    out.message = b.message;
  } else if (typeof b.detail === "string") {
    out.message = b.detail;
  } else if (
    b.error &&
    typeof (b.error as Record<string, unknown>).message === "string"
  ) {
    out.message = (b.error as Record<string, unknown>).message;
  }

  if (Array.isArray(b.errors)) {
    out.errors = b.errors
      .filter(
        (e): e is Record<string, unknown> =>
          Boolean(e) && typeof e === "object",
      )
      .map((e) => ({
        ...(typeof e.field === "string" ? { field: e.field } : {}),
        ...(typeof e.message === "string" ? { message: e.message } : {}),
      }));
  }

  if (out.message === undefined && out.errors === undefined) {
    out.message = fallback;
  }

  return out;
}
