// Dependency-free JWT expiry check shared by the authenticated proxy
// (`backend.ts`) and the optimistic route guard (`proxy.ts`, middleware runtime).
// Keep this module free of `next/headers`, Node, or other runtime-specific imports
// so it stays importable from the edge/middleware bundle.

// Treat a token as expired a short window *before* its real `exp` so a token about
// to lapse mid-flight is refreshed up front rather than sent and rejected by the
// backend. Keep well under the access-token lifetime.
export const JWT_EXPIRY_LEEWAY_MS = 10_000;

export function isExpiredJwt(token: string) {
  const [, payload] = token.split(".");
  if (!payload) return false;

  try {
    const normalized = payload.replace(/-/g, "+").replace(/_/g, "/");
    const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, "=");
    const decoded = JSON.parse(atob(padded)) as { exp?: number };

    return (
      typeof decoded.exp === "number" &&
      decoded.exp * 1000 - JWT_EXPIRY_LEEWAY_MS <= Date.now()
    );
  } catch {
    return false;
  }
}
