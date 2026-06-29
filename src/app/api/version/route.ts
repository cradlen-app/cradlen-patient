import { NextResponse } from "next/server";
import { BUILD_INFO } from "@/infrastructure/config/build-info";

// Always reflect the *live* deployment serving this request, never a cached copy
// — the client compares this build id against the one baked into its bundle to
// detect that a new version has been deployed.
export const dynamic = "force-dynamic";
export const revalidate = 0;

export function GET() {
  return NextResponse.json(
    {
      version: BUILD_INFO.version,
      buildId: BUILD_INFO.buildId,
      commit: BUILD_INFO.commit,
      // Runtime-only: the live deployment id, not baked into any bundle.
      deploymentId: process.env.VERCEL_DEPLOYMENT_ID ?? null,
      builtAt: BUILD_INFO.builtAt,
    },
    { headers: { "Cache-Control": "no-store, max-age=0" } },
  );
}
