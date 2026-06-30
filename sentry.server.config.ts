// Sentry server-runtime init. Loaded by `src/instrumentation.ts` for the
// Node.js runtime. Disabled automatically when no DSN is set (local/test).
import * as Sentry from "@sentry/nextjs";

import { scrubEvent } from "@/infrastructure/monitoring/sentry-scrub";

const dsn = process.env.SENTRY_DSN || process.env.NEXT_PUBLIC_SENTRY_DSN;

Sentry.init({
  dsn,
  enabled: Boolean(dsn),
  environment: process.env.VERCEL_ENV || process.env.NODE_ENV,
  release: process.env.NEXT_PUBLIC_COMMIT_SHA || undefined,
  // Trace a small sample in production; off otherwise to avoid noise/cost.
  tracesSampleRate: process.env.NODE_ENV === "production" ? 0.1 : 0,
  // Health portal: never attach IP, cookies, or request bodies by default.
  sendDefaultPii: false,
  beforeSend: (event) => scrubEvent(event),
});
