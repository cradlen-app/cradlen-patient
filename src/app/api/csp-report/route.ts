import { NextResponse, type NextRequest } from "next/server";

/**
 * Collects Content-Security-Policy violation reports from the Report-Only policy
 * (see `next.config.ts`). Browsers POST these without credentials, so the route
 * is intentionally unauthenticated and side-effect-free: it logs a concise,
 * size-capped summary server-side and returns 204. It never echoes the report
 * back and never reaches the backend.
 */
export async function POST(request: NextRequest) {
  try {
    const raw = await request.text();
    // Cap to avoid logging an oversized body; reports are small.
    const summary = raw.length > 2000 ? `${raw.slice(0, 2000)}…` : raw;
    if (summary.trim()) {
      console.warn("[csp-report]", summary);
    }
  } catch {
    // Never fail a report submission — there is nothing the client can do.
  }
  return new NextResponse(null, { status: 204 });
}
