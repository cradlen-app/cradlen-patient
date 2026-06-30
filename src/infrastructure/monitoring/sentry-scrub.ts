/**
 * PII scrubbing for Sentry events.
 *
 * This is a patient health portal: national IDs, auth tokens, names, phone
 * numbers, addresses, dates of birth, security answers, and patient ids must
 * NEVER leave the app inside an error report. `Sentry.init({ sendDefaultPii:
 * false })` already keeps the SDK from attaching IP/cookies by default; this
 * `beforeSend` hook is the belt-and-suspenders pass that strips anything
 * sensitive that still made it into an event (request data, query strings,
 * headers, breadcrumb data, extra context).
 */
import type { ErrorEvent } from "@sentry/nextjs";

/** Keys whose values are redacted wherever they appear in an event. */
const SENSITIVE_KEY =
  /(national[_-]?id|password|pass|token|secret|security[_-]?answer|otp|phone|address|full[_-]?name|first[_-]?name|last[_-]?name|date[_-]?of[_-]?birth|dob|patient[_-]?id|authorization|cookie|refresh|email)/i;

const REDACTED = "[redacted]";
const MAX_DEPTH = 6;

function redactDeep(value: unknown, depth = 0): unknown {
  if (value == null || depth > MAX_DEPTH) return value;
  if (Array.isArray(value)) return value.map((v) => redactDeep(v, depth + 1));
  if (typeof value === "object") {
    const out: Record<string, unknown> = {};
    for (const [key, val] of Object.entries(value as Record<string, unknown>)) {
      out[key] = SENSITIVE_KEY.test(key) ? REDACTED : redactDeep(val, depth + 1);
    }
    return out;
  }
  return value;
}

/** Drop the query string from a URL string (it can carry patient_id, …). */
function stripQuery(url: string): string {
  return url.split("?")[0];
}

/**
 * Sentry `beforeSend` hook: mutates and returns the event with all PII stripped
 * out of request data, query strings, headers, breadcrumb data, and extra
 * context. Returning the event keeps the report (now scrubbed).
 */
export function scrubEvent(event: ErrorEvent): ErrorEvent {
  const req = event.request;
  if (req) {
    delete req.cookies;
    if (req.headers) {
      for (const name of Object.keys(req.headers)) {
        if (SENSITIVE_KEY.test(name)) delete req.headers[name];
      }
    }
    if (typeof req.url === "string") req.url = stripQuery(req.url);
    delete req.query_string;
    if (req.data) req.data = redactDeep(req.data);
  }

  if (event.extra) {
    event.extra = redactDeep(event.extra) as typeof event.extra;
  }

  if (Array.isArray(event.breadcrumbs)) {
    for (const crumb of event.breadcrumbs) {
      if (crumb.data) crumb.data = redactDeep(crumb.data) as typeof crumb.data;
      if (typeof crumb.message === "string") {
        crumb.message = stripQuery(crumb.message);
      }
    }
  }

  return event;
}
