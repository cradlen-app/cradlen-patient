/**
 * Server-side error reporting to the monitoring backend (Sentry).
 *
 * Route handlers sanitize backend failures and return a clean response rather
 * than throwing, so Next's automatic `onRequestError` capture never sees them.
 * This helper makes those swallowed 5xx/refresh failures visible.
 *
 * - No-op when no DSN is configured (local dev, unit tests), so importing it is
 *   free and the Sentry SDK is only loaded (lazily) when actually reporting.
 * - NEVER pass PII in `context` (no national ids, tokens, names, bodies). The
 *   `beforeSend` scrubber is a backstop, not a license to send raw data.
 */
const dsnConfigured = () =>
  Boolean(process.env.SENTRY_DSN || process.env.NEXT_PUBLIC_SENTRY_DSN);

export function reportServerError(
  error: unknown,
  context?: Record<string, string | number | boolean>,
): void {
  if (!dsnConfigured()) return;
  void import("@sentry/nextjs")
    .then((Sentry) => {
      Sentry.captureException(
        error instanceof Error ? error : new Error(String(error)),
        context ? { extra: context } : undefined,
      );
    })
    .catch(() => {
      // Monitoring must never break the request path.
    });
}
