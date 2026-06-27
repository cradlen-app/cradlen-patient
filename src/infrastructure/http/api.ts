const DEFAULT_API_BASE_URL = "https://api.cradlen.com/v1";

// Token-issuing backend calls are rewritten to local route handlers that set
// the HttpOnly patient cookies and return only non-sensitive session state.
const SESSION_ENDPOINTS: Record<string, string> = {
  "/patient-auth/login": "/api/patient-auth/login",
  "/patient-auth/signup/start": "/api/patient-auth/signup/start",
  "/patient-auth/signup/complete": "/api/patient-auth/signup/complete",
};

export class ApiError extends Error {
  messages: string[];

  constructor(
    public status: number,
    message: string | string[],
    public body?: unknown,
  ) {
    const messages = Array.isArray(message) ? message : [message];

    super(messages.join("\n"));
    this.messages = messages;
  }
}

function getPublicApiBaseUrl() {
  return process.env.NEXT_PUBLIC_API_URL ?? DEFAULT_API_BASE_URL;
}

function resolveApiUrl(path: string) {
  if (/^https?:\/\//.test(path)) return path;

  const [pathname, search = ""] = path.split("?");
  const localEndpoint = SESSION_ENDPOINTS[pathname];

  if (localEndpoint) {
    return `${localEndpoint}${search ? `?${search}` : ""}`;
  }

  if (path.startsWith("/api/")) {
    return path;
  }

  return `${getPublicApiBaseUrl()}${path}`;
}

async function parseResponseBody(res: Response) {
  if (res.status === 204) return undefined;

  const text = await res.text();
  if (!text) return undefined;

  try {
    return JSON.parse(text) as unknown;
  } catch {
    return text;
  }
}

function extractApiErrorMessage(body: unknown, fallback: string) {
  if (!body || typeof body !== "object") return fallback;

  const b = body as Record<string, unknown>;

  // Single string message
  if (typeof b.message === "string") return b.message;

  // Nested { error: { message } }
  if (b.error && typeof (b.error as Record<string, unknown>).message === "string") {
    return (b.error as Record<string, unknown>).message as string;
  }

  // Array of validation errors: { errors: [{ message }] }
  if (Array.isArray(b.errors) && b.errors.length > 0) {
    const first = b.errors[0];
    if (first && typeof (first as Record<string, unknown>).message === "string") {
      return (first as Record<string, unknown>).message as string;
    }
  }

  // { detail: "..." } (common in some backends)
  if (typeof b.detail === "string") return b.detail;

  return fallback;
}

// Authenticated patient calls go through same-origin route handlers under
// `/api/patient-portal/*` and `/api/patient-auth/*`, which attach the HttpOnly
// patient token server-side. The browser only needs to send its cookies, so a
// plain credentialed fetch is all the client requires — there is no flat
// multi-tenant header injection here (patient sessions are not org-scoped).
export async function apiFetch<T>(
  path: string,
  options?: RequestInit,
): Promise<T> {
  const { headers, ...restOptions } = options ?? {};
  const url = resolveApiUrl(path);
  const res = await fetch(url, {
    ...restOptions,
    credentials: url.startsWith("/api/") ? "include" : restOptions.credentials,
    headers: { "Content-Type": "application/json", ...headers },
  });
  const body = await parseResponseBody(res);

  if (!res.ok) {
    throw new ApiError(
      res.status,
      extractApiErrorMessage(body, res.statusText),
      body,
    );
  }

  return body as T;
}
