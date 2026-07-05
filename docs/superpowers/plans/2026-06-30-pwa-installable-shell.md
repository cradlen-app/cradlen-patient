# PWA Phase 1 — Installable App Shell Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the Cradlen patient portal installable to the home screen — manifest, icon set, and a Serwist service worker that precaches the static shell and serves an offline fallback — without ever caching authenticated patient data.

**Architecture:** Next.js 16 App Router with a Turbopack-native Serwist service worker. The SW precaches the build's static shell (via `self.__SW_MANIFEST`), runtime-caches images/fonts, treats every authenticated `/api/*` route as `NetworkOnly`, and falls back to a locale-neutral `/~offline` page for document navigations when offline. A web app manifest (`manifest.ts`) plus install metadata in the root layout advertise installability. A small client component registers the SW; the existing `UpdateBanner` remains the only user-facing "update available" prompt.

**Tech Stack:** Next.js 16.2.9 (Turbopack), React 19, TypeScript, `serwist` + `@serwist/next` + `@serwist/turbopack` + `@serwist/window`, `sharp` (icon generation), Vitest (unit), Playwright (e2e), next-intl.

## Global Constraints

- Next.js **16.2.9**, build runs on **Turbopack** (the Next 16 default). The legacy webpack `withSerwistInit` plugin is NOT used — use the `@serwist/turbopack` route.
- Source root is **`src/`** (path alias `@/*` → `src/*`). All app code lives under `src/app`, not `app`.
- The SW must **never cache** `/api/patient-portal/*` or `/api/patient-auth/*` (PHI/tokens). These are `NetworkOnly`.
- Manifest `start_url` and `scope` are **`"/"`** (locale-neutral) so one install serves both `/en` and `/ar`.
- Any new user-facing string lives in `src/features/patient-portal/messages/{en,ar}.json` with **en/ar key parity** — EXCEPT the offline page, which is intentionally self-contained bilingual (it must render with zero runtime data).
- CSP is emitted per-request in `src/proxy.ts` (`buildCsp`), not in `next.config.ts`.
- Commit after every task. Run `npm run lint` and `npx tsc --noEmit --pretty false` before each commit.

---

### Task 1: Root `public/` directory + PWA icon set

**Files:**
- Create: `public/icons/icon-192.png`, `public/icons/icon-512.png`, `public/icons/icon-maskable-512.png`, `public/icons/apple-touch-icon.png`
- Create: `scripts/generate-pwa-icons.mjs`
- Test: `src/app/__tests__/pwa-icons.test.ts`
- Source asset: `src/public/Logo.png` (existing)

**Interfaces:**
- Produces: four PNG files at the paths above with exact pixel dimensions 192×192, 512×512, 512×512, 180×180. Consumed by Task 2 (manifest) and Task 3 (metadata).

- [ ] **Step 1: Write the failing test**

`src/app/__tests__/pwa-icons.test.ts` — reads each PNG's IHDR header (bytes 16–23) to assert dimensions, no image library needed:

```ts
import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import { describe, it, expect } from "vitest";

function pngSize(path: string) {
  const buf = readFileSync(path);
  // PNG IHDR width/height are big-endian uint32 at byte offsets 16 and 20.
  return { width: buf.readUInt32BE(16), height: buf.readUInt32BE(20) };
}

const ICONS = "public/icons";
const cases: [string, number, number][] = [
  ["icon-192.png", 192, 192],
  ["icon-512.png", 512, 512],
  ["icon-maskable-512.png", 512, 512],
  ["apple-touch-icon.png", 180, 180],
];

describe("pwa icons", () => {
  it.each(cases)("%s has correct dimensions", (file, w, h) => {
    const path = join(ICONS, file);
    expect(existsSync(path), `${path} should exist`).toBe(true);
    expect(pngSize(path)).toEqual({ width: w, height: h });
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/app/__tests__/pwa-icons.test.ts`
Expected: FAIL — files do not exist yet (`ENOENT` / "should exist").

- [ ] **Step 3: Add `sharp` and write the generator script**

Run: `npm i -D sharp`

`scripts/generate-pwa-icons.mjs`:

```js
import sharp from "sharp";
import { mkdirSync } from "node:fs";

const SRC = "src/public/Logo.png";
const OUT = "public/icons";
mkdirSync(OUT, { recursive: true });

const brandBg = { r: 255, g: 255, b: 255, alpha: 1 };

async function plain(size, name) {
  await sharp(SRC)
    .resize(size, size, { fit: "contain", background: brandBg })
    .png()
    .toFile(`${OUT}/${name}`);
}

// Maskable: logo shrunk to the ~80% safe zone, padded on a solid background so
// Android's circular/squircle mask never clips the mark.
async function maskable(size, name) {
  const inner = Math.round(size * 0.8);
  const logo = await sharp(SRC)
    .resize(inner, inner, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toBuffer();
  await sharp({ create: { width: size, height: size, channels: 4, background: brandBg } })
    .composite([{ input: logo, gravity: "center" }])
    .png()
    .toFile(`${OUT}/${name}`);
}

await plain(192, "icon-192.png");
await plain(512, "icon-512.png");
await plain(180, "apple-touch-icon.png");
await maskable(512, "icon-maskable-512.png");
console.log("PWA icons generated.");
```

- [ ] **Step 4: Generate the icons and run the test to verify it passes**

Run: `node scripts/generate-pwa-icons.mjs && npx vitest run src/app/__tests__/pwa-icons.test.ts`
Expected: PASS — all four dimension assertions green.

- [ ] **Step 5: Commit**

```bash
git add public/icons scripts/generate-pwa-icons.mjs src/app/__tests__/pwa-icons.test.ts package.json package-lock.json
git commit -m "feat(pwa): generate installable icon set into root public/"
```

---

### Task 2: Web app manifest (`src/app/manifest.ts`)

**Files:**
- Create: `src/app/manifest.ts`
- Test: `src/app/__tests__/manifest.test.ts`

**Interfaces:**
- Produces: a default function `manifest(): MetadataRoute.Manifest`. Served by Next at `/manifest.webmanifest`. Consumed by the browser and by Task 3's metadata `manifest` link.

- [ ] **Step 1: Write the failing test**

`src/app/__tests__/manifest.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import manifest from "../manifest";

describe("web app manifest", () => {
  const m = manifest();

  it("is installable and locale-neutral", () => {
    expect(m.start_url).toBe("/");
    expect(m.scope).toBe("/");
    expect(m.display).toBe("standalone");
    expect(m.name).toBeTruthy();
    expect(m.short_name).toBeTruthy();
    expect(m.theme_color).toBeTruthy();
    expect(m.background_color).toBeTruthy();
  });

  it("ships a maskable 512 icon and standard sizes", () => {
    const icons = m.icons ?? [];
    expect(icons.some((i) => i.sizes === "192x192")).toBe(true);
    expect(icons.some((i) => i.sizes === "512x512" && i.purpose === "any")).toBe(true);
    expect(icons.some((i) => i.sizes === "512x512" && i.purpose === "maskable")).toBe(true);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/app/__tests__/manifest.test.ts`
Expected: FAIL — `Cannot find module '../manifest'`.

- [ ] **Step 3: Implement the manifest**

`src/app/manifest.ts`:

```ts
import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Cradlen",
    short_name: "Cradlen",
    description: "Your health record, visits, medications, and lab results.",
    start_url: "/",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#ffffff",
    theme_color: "#ffffff",
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icons/icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
```

> NOTE: confirm the brand theme/background colors against `src/styles/globals.css` brand tokens and replace `#ffffff` if a brand color is defined there. Per AGENTS.md, if you change a brand token also mirror it to `cradlen-web`.

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/app/__tests__/manifest.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/app/manifest.ts src/app/__tests__/manifest.test.ts
git commit -m "feat(pwa): add locale-neutral web app manifest"
```

---

### Task 3: Install metadata + viewport in the root layout

**Files:**
- Create: `src/app/pwa-metadata.ts`
- Modify: `src/app/layout.tsx:21-24` (the `metadata` export) and add a `viewport` export
- Test: `src/app/__tests__/pwa-metadata.test.ts`

**Interfaces:**
- Produces: `pwaMetadata: Metadata` and `pwaViewport: Viewport` from `src/app/pwa-metadata.ts`. Consumed by `src/app/layout.tsx`.

- [ ] **Step 1: Write the failing test**

`src/app/__tests__/pwa-metadata.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import { pwaMetadata, pwaViewport } from "../pwa-metadata";

describe("pwa metadata", () => {
  it("links the manifest and apple touch icon", () => {
    expect(pwaMetadata.manifest).toBe("/manifest.webmanifest");
    const apple = pwaMetadata.icons as { apple?: unknown };
    expect(apple.apple).toBeTruthy();
  });

  it("marks the app as apple web app capable", () => {
    const awa = pwaMetadata.appleWebApp as { capable?: boolean; title?: string };
    expect(awa.capable).toBe(true);
    expect(awa.title).toBe("Cradlen");
  });

  it("sets a theme color in the viewport", () => {
    expect(pwaViewport.themeColor).toBeTruthy();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/app/__tests__/pwa-metadata.test.ts`
Expected: FAIL — `Cannot find module '../pwa-metadata'`.

- [ ] **Step 3: Implement the module**

`src/app/pwa-metadata.ts`:

```ts
import type { Metadata, Viewport } from "next";

export const pwaMetadata: Metadata = {
  manifest: "/manifest.webmanifest",
  applicationName: "Cradlen",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Cradlen",
  },
  icons: {
    icon: [
      { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [{ url: "/icons/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
  },
};

export const pwaViewport: Viewport = {
  themeColor: "#ffffff",
  viewportFit: "cover",
};
```

- [ ] **Step 4: Wire it into the root layout**

In `src/app/layout.tsx`, replace the `metadata` export (lines 21–24) and add a `viewport` export. Keep `Metadata`/add `Viewport` to the type import on line 1:

```ts
import type { Metadata, Viewport } from "next";
// ...existing imports...
import { pwaMetadata, pwaViewport } from "./pwa-metadata";

export const metadata: Metadata = {
  title: "Cradlen",
  description: "Cradlen",
  ...pwaMetadata,
};

export const viewport: Viewport = {
  ...pwaViewport,
};
```

- [ ] **Step 5: Run tests + typecheck to verify they pass**

Run: `npx vitest run src/app/__tests__/pwa-metadata.test.ts && npx tsc --noEmit --pretty false`
Expected: PASS, no type errors.

- [ ] **Step 6: Commit**

```bash
git add src/app/pwa-metadata.ts src/app/layout.tsx src/app/__tests__/pwa-metadata.test.ts
git commit -m "feat(pwa): add install metadata and viewport to root layout"
```

---

### Task 4: Service worker + Turbopack route (build green)

**Files:**
- Create: `src/app/sw.ts` (service worker source)
- Create: `src/app/sw.js/route.ts` (Turbopack route that compiles + serves `/sw.js`)
- Modify: `tsconfig.json` (add WebWorker lib handling — see Step 3)
- Modify: `package.json` (dependencies)

**Interfaces:**
- Produces: a service worker served at `/sw.js` (scope `/`) that precaches `self.__SW_MANIFEST` + `/~offline`, runtime-caches via `defaultCache`, applies `NetworkOnly` to `/api/patient-portal/*` and `/api/patient-auth/*`, and serves `/~offline` for offline document navigations. Consumed by Task 5 (registration). The `/~offline` page is built in Task 6 but is referenced here as a precache entry.

- [ ] **Step 1: Install dependencies**

Run: `npm i serwist @serwist/next @serwist/turbopack @serwist/window`

- [ ] **Step 2: Write the service worker source**

`src/app/sw.ts`:

```ts
/// <reference lib="webworker" />
import { defaultCache } from "@serwist/next/worker";
import type { PrecacheEntry, SerwistGlobalConfig } from "serwist";
import { NetworkOnly, RegExpRoute, Serwist } from "serwist";

declare global {
  interface WorkerGlobalScope extends SerwistGlobalConfig {
    __SW_MANIFEST: (PrecacheEntry | string)[] | undefined;
  }
}

declare const self: ServiceWorkerGlobalScope;

const serwist = new Serwist({
  precacheEntries: self.__SW_MANIFEST,
  skipWaiting: true,
  clientsClaim: true,
  navigationPreload: true,
  runtimeCaching: defaultCache,
  fallbacks: {
    entries: [
      {
        url: "/~offline",
        matcher({ request }) {
          return request.destination === "document";
        },
      },
    ],
  },
});

// Hard privacy boundary: authenticated patient API responses are NEVER cached.
// Registered before `addEventListeners` so it wins over any default route.
serwist.registerRoute(
  new RegExpRoute(/^\/api\/(patient-portal|patient-auth)\//, new NetworkOnly()),
);

serwist.addEventListeners();
```

- [ ] **Step 3: Add the Turbopack route + WebWorker typing**

`src/app/sw.js/route.ts`:

```ts
import { spawnSync } from "node:child_process";
import { createSerwistRoute } from "@serwist/turbopack";

const revision =
  spawnSync("git", ["rev-parse", "HEAD"], { encoding: "utf-8" }).stdout?.trim() ||
  process.env.NEXT_PUBLIC_BUILD_ID ||
  "dev";

export const { dynamic, dynamicParams, revalidate, generateStaticParams, GET } =
  createSerwistRoute({
    additionalPrecacheEntries: [{ url: "/~offline", revision }],
    swSrc: "src/app/sw.ts",
    useNativeEsbuild: true,
  });
```

In `tsconfig.json`, ensure the worker file can use `ServiceWorkerGlobalScope`. The `/// <reference lib="webworker" />` in `sw.ts` provides it per-file. If `npx tsc --noEmit` reports lib conflicts, add `"@serwist/next/typings"` to `compilerOptions.types` (Serwist ships SW ambient types) rather than adding `webworker` globally (which conflicts with `dom`).

- [ ] **Step 4: Verify the build produces a working SW**

Run: `npm run build`
Expected: build succeeds with Turbopack; no errors about `sw.ts` / `createSerwistRoute`.

Run: `npm run dev` (port 3200), then in a second shell: `curl -sS -o /dev/null -w "%{http_code}\n" http://localhost:3200/sw.js`
Expected: `200`.

- [ ] **Step 5: Typecheck + lint**

Run: `npx tsc --noEmit --pretty false && npm run lint`
Expected: clean.

- [ ] **Step 6: Commit**

```bash
git add src/app/sw.ts src/app/sw.js/route.ts tsconfig.json package.json package-lock.json
git commit -m "feat(pwa): add Serwist service worker with NetworkOnly API routes"
```

---

### Task 5: Service worker registration (no double update prompt)

**Files:**
- Create: `src/components/pwa/ServiceWorkerRegister.tsx`
- Modify: `src/app/[locale]/layout.tsx` (mount the component)
- Test: `e2e/pwa-service-worker.spec.ts`

**Interfaces:**
- Consumes: the SW served at `/sw.js` from Task 4.
- Produces: a `"use client"` component `ServiceWorkerRegister` that registers `/sw.js` on mount. Renders nothing.

- [ ] **Step 1: Write the failing e2e test**

`e2e/pwa-service-worker.spec.ts` (follow existing `e2e/` config; adjust `baseURL`/port if the Playwright config differs):

```ts
import { test, expect } from "@playwright/test";

test("registers a service worker controlling the page", async ({ page }) => {
  await page.goto("/en/patient/signin");
  await page.waitForFunction(async () => {
    if (!("serviceWorker" in navigator)) return false;
    const reg = await navigator.serviceWorker.ready;
    return Boolean(reg.active);
  });
  const scope = await page.evaluate(async () => {
    const reg = await navigator.serviceWorker.ready;
    return reg.scope;
  });
  expect(scope).toContain("/");
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx playwright test e2e/pwa-service-worker.spec.ts`
Expected: FAIL — `waitForFunction` times out (no SW registered yet).

- [ ] **Step 3: Implement the registration component**

`src/components/pwa/ServiceWorkerRegister.tsx`. Register only — do NOT prompt on `waiting`; the existing `UpdateBanner`/`useVersionCheck` owns the user-facing update prompt, and `skipWaiting`/`clientsClaim` in the SW activates the new version on the next load:

```tsx
"use client";

import { useEffect } from "react";

export function ServiceWorkerRegister() {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;
    let cancelled = false;
    (async () => {
      try {
        const { Serwist } = await import("@serwist/window");
        if (cancelled) return;
        const serwist = new Serwist("/sw.js", { scope: "/", type: "classic" });
        // Intentionally no `waiting`/reload handler: avoid double update prompts.
        void serwist.register();
      } catch {
        // SW registration is best-effort; the app works without it.
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return null;
}
```

- [ ] **Step 4: Mount it in the locale layout**

In `src/app/[locale]/layout.tsx`, import and render inside `<Providers>`:

```tsx
import { ServiceWorkerRegister } from "@/components/pwa/ServiceWorkerRegister";
// ...
      <Providers>
        <LocaleDocumentSync locale={currentLocale} />
        <ServiceWorkerRegister />
        {children}
      </Providers>
```

- [ ] **Step 5: Run the e2e test to verify it passes**

Run: `npm run build && npx playwright test e2e/pwa-service-worker.spec.ts`
Expected: PASS (run against a production build so the SW is served and precaches).

- [ ] **Step 6: Commit**

```bash
git add src/components/pwa/ServiceWorkerRegister.tsx src/app/[locale]/layout.tsx e2e/pwa-service-worker.spec.ts
git commit -m "feat(pwa): register service worker on the client"
```

---

### Task 6: Offline fallback page (`/~offline`)

**Files:**
- Create: `src/app/~offline/page.tsx`
- Modify: `src/proxy.ts:154` (matcher — exclude `~offline` from locale handling)

**Interfaces:**
- Produces: a self-contained bilingual static page served at `/~offline`. Consumed by the SW fallback (Task 4) and precached via `additionalPrecacheEntries`.

- [ ] **Step 1: Exclude `~offline` from the i18n middleware matcher**

In `src/proxy.ts`, change the matcher (line 154) so the dot-less `/~offline` path is not locale-redirected:

```ts
export const config = {
  matcher: ["/((?!api|_next|_vercel|~offline|.*\\..*).*)"],
};
```

- [ ] **Step 2: Write the offline page**

`src/app/~offline/page.tsx` — no next-intl, no data fetching; renders both languages so it works with zero runtime context:

```tsx
export const dynamic = "force-static";

export default function OfflinePage() {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-3 p-6 text-center">
      <h1 className="text-xl font-semibold">You're offline</h1>
      <p className="text-sm text-gray-600">
        Cradlen needs a connection to load your health information. Reconnect and try again.
      </p>
      <hr className="my-2 w-24 border-gray-200" />
      <h2 className="text-xl font-semibold" dir="rtl" lang="ar">
        أنت غير متصل بالإنترنت
      </h2>
      <p className="text-sm text-gray-600" dir="rtl" lang="ar">
        يحتاج Cradlen إلى اتصال لعرض معلوماتك الصحية. أعد الاتصال وحاول مرة أخرى.
      </p>
    </main>
  );
}
```

- [ ] **Step 3: Verify the page is reachable and not locale-redirected**

Run: `npm run dev`, then: `curl -sS -o /dev/null -w "%{http_code} %{redirect_url}\n" http://localhost:3200/~offline`
Expected: `200` with no redirect to `/en/~offline`.

- [ ] **Step 4: Typecheck + lint**

Run: `npx tsc --noEmit --pretty false && npm run lint`
Expected: clean.

- [ ] **Step 5: Commit**

```bash
git add src/app/~offline/page.tsx src/proxy.ts
git commit -m "feat(pwa): add offline fallback page served when disconnected"
```

---

### Task 7: CSP allowances + offline & PHI-cache e2e verification

**Files:**
- Modify: `src/proxy.ts:51-66` (`buildCsp` — add `worker-src` and `manifest-src`)
- Test: `e2e/pwa-offline-and-cache.spec.ts`

**Interfaces:**
- Consumes: the SW (Task 4), registration (Task 5), and offline page (Task 6).
- Produces: a CSP that explicitly permits the worker and manifest; an e2e test proving offline fallback works and no PHI is cached.

- [ ] **Step 1: Write the failing e2e test**

`e2e/pwa-offline-and-cache.spec.ts`:

```ts
import { test, expect } from "@playwright/test";

test("serves the offline page and never caches patient API responses", async ({ page, context }) => {
  await page.goto("/en/patient/signin");
  await page.waitForFunction(async () => Boolean((await navigator.serviceWorker.ready).active));

  // No authenticated API response may sit in Cache Storage.
  const cachedApi = await page.evaluate(async () => {
    const names = await caches.keys();
    for (const name of names) {
      const cache = await caches.open(name);
      const reqs = await cache.keys();
      if (reqs.some((r) => /\/api\/(patient-portal|patient-auth)\//.test(new URL(r.url).pathname))) {
        return true;
      }
    }
    return false;
  });
  expect(cachedApi).toBe(false);

  // Offline navigation falls back to the offline page, not a browser error.
  await context.setOffline(true);
  await page.goto("/en/patient/visits").catch(() => {});
  await expect(page.locator("text=You're offline")).toBeVisible();
  await context.setOffline(false);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run build && npx playwright test e2e/pwa-offline-and-cache.spec.ts`
Expected: FAIL — offline navigation does not yet resolve to the offline page (fallback wiring exercised end-to-end for the first time), or CSP blocks the worker.

- [ ] **Step 3: Add `worker-src` and `manifest-src` to the CSP**

In `src/proxy.ts`, inside `buildCsp`'s array (after the `script-src` line), add:

```ts
    "worker-src 'self'",
    "manifest-src 'self'",
```

> This CSP change is patient-PWA-specific and need not be mirrored to `cradlen-web` (the staff app is not a PWA).

- [ ] **Step 4: Run the e2e test to verify it passes**

Run: `npm run build && npx playwright test e2e/pwa-offline-and-cache.spec.ts`
Expected: PASS — no cached PHI; offline page visible.

- [ ] **Step 5: Commit**

```bash
git add src/proxy.ts e2e/pwa-offline-and-cache.spec.ts
git commit -m "feat(pwa): allow worker/manifest in CSP and verify offline + no-PHI-cache"
```

---

### Task 8: Full verification pass

**Files:** none (verification only).

- [ ] **Step 1: Run the full automated suite**

Run: `npm run lint && npx tsc --noEmit --pretty false && npm run build && npm run test && npx playwright test`
Expected: all green.

- [ ] **Step 2: Manual DevTools verification (`npm run dev`, port 3200)**

In Chrome DevTools → **Application**:
- Manifest parses with no errors; all icons (incl. maskable) load.
- Service worker is **activated and running**.
- **Lighthouse** → "Installable" / PWA checks pass.
- **Cache Storage**: after visiting `/en/patient/...` pages, confirm NO `/api/patient-portal/*` or `/api/patient-auth/*` entries.
- DevTools **Offline** → cold-navigate: offline page shows (not a browser error); previously loaded static shell still renders.
- **Install** on desktop + Android Chrome: launches standalone with correct icon/name/theme color; `start_url` resolves to the user's locale.
- Repeat the install check starting from `/ar/...` (RTL) — behaves identically.

- [ ] **Step 3: Push the branch**

```bash
git push -u origin feat/pwa-installable-shell
```

---

## Self-Review Notes

- **Spec coverage:** icons (T1), manifest (T2), metadata/viewport (T3), Serwist SW + NetworkOnly API (T4), registration + update coexistence (T5), offline fallback (T6), CSP + PHI-cache audit + offline e2e (T7), full verification incl. locale parity (T8). All spec sections map to a task.
- **No-PHI-cache** boundary is implemented in T4 (`NetworkOnly` route) and *proven* in T7 (cache audit e2e).
- **Type consistency:** `pwaMetadata`/`pwaViewport` (T3), `ServiceWorkerRegister` (T5), `manifest` default export (T2), and `/~offline` URL (used in T4 fallback + T4 precache entry + T6 page + T6 matcher exclusion) are consistent across tasks.
- **Open contingency (documented, not a placeholder):** if `@serwist/turbopack`'s `createSerwistRoute` proves incompatible with Next 16.2.9 at build time (T4 Step 4 fails), fall back to the webpack plugin: `npm i -D @serwist/next`, wrap `next.config.ts` with `withSerwistInit({ swSrc: "src/app/sw.ts", swDest: "public/sw.js", additionalPrecacheEntries: [{ url: "/~offline", revision }] })` composed *inside* `withSentryConfig(withNextIntl(...))`, run `next build --webpack`, and delete `src/app/sw.js/route.ts`. The SW source, registration, manifest, icons, metadata, offline page, and CSP tasks are all unchanged.
