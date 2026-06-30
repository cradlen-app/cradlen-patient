import * as Sentry from "@sentry/nextjs";

/**
 * Next.js server instrumentation hook. Loads the matching Sentry init for the
 * active runtime. `onRequestError` forwards uncaught route-handler / RSC errors
 * to Sentry (swallowed backend 5xx are reported explicitly via
 * `@/infrastructure/monitoring/report`).
 */
export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    await import("../sentry.server.config");
  }
  if (process.env.NEXT_RUNTIME === "edge") {
    await import("../sentry.edge.config");
  }
}

export const onRequestError = Sentry.captureRequestError;
