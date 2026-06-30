import { spawnSync } from "node:child_process";
import { createSerwistRoute } from "@serwist/turbopack";

const revision =
  spawnSync("git", ["rev-parse", "HEAD"], { encoding: "utf-8" }).stdout?.trim() ||
  process.env.NEXT_PUBLIC_BUILD_ID ||
  "dev";

// `createSerwistRoute` is built for a dynamic `[path]` route segment: its `GET`
// reads `params.path` to choose which compiled Serwist file to serve, and it
// ships a `generateStaticParams` that resolves to `{ path: "sw.js" }`. We serve
// the worker from the *static* `/sw.js` route instead so it gets root scope
// (`/`) and the canonical URL Task 5's registration expects. Re-exporting the
// handler's `GET`/`generateStaticParams` verbatim fails Next 16's route-type
// validator (a static route's `params` is `Promise<{}>`, not `{ path: string }`),
// so we bridge: keep the segment config and hand the underlying handler the
// single filename it would otherwise derive from the dynamic param.
const serwistRoute = createSerwistRoute({
  additionalPrecacheEntries: [{ url: "/~offline", revision }],
  swSrc: "src/app/sw.ts",
  useNativeEsbuild: true,
});

// Next.js requires these segment-config exports to be statically analyzable
// literals (they cannot be read off `serwistRoute`). These mirror the values
// `createSerwistRoute` returns: the worker is built once and served statically.
export const dynamic = "force-static";
export const revalidate = false;

export function GET(request: Request) {
  return serwistRoute.GET(request, {
    params: Promise.resolve({ path: "sw.js" }),
  });
}
