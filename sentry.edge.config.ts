// Sentry edge-runtime init (middleware / edge route handlers). Loaded by
// `src/instrumentation.ts` for the edge runtime. Disabled when no DSN is set.
import * as Sentry from "@sentry/nextjs";

import { scrubEvent } from "@/infrastructure/monitoring/sentry-scrub";

const dsn = process.env.SENTRY_DSN || process.env.NEXT_PUBLIC_SENTRY_DSN;

Sentry.init({
  dsn,
  enabled: Boolean(dsn),
  environment: process.env.VERCEL_ENV || process.env.NODE_ENV,
  release: process.env.NEXT_PUBLIC_COMMIT_SHA || undefined,
  tracesSampleRate: process.env.NODE_ENV === "production" ? 0.1 : 0,
  sendDefaultPii: false,
  beforeSend: (event) => scrubEvent(event),
});
