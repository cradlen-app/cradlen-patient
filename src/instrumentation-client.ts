// Sentry browser init. Next.js loads this on the client automatically.
// Disabled when no public DSN is set (local/test/preview without monitoring).
import * as Sentry from "@sentry/nextjs";

import { scrubEvent } from "@/infrastructure/monitoring/sentry-scrub";

const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN;

Sentry.init({
  dsn,
  enabled: Boolean(dsn),
  environment: process.env.NEXT_PUBLIC_GIT_REF || process.env.NODE_ENV,
  release: process.env.NEXT_PUBLIC_COMMIT_SHA || undefined,
  tracesSampleRate: process.env.NODE_ENV === "production" ? 0.1 : 0,
  // Health portal: do not capture IP / form values / session replay by default.
  sendDefaultPii: false,
  beforeSend: (event) => scrubEvent(event),
});

// Lets Sentry instrument client-side navigations for tracing.
export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;
