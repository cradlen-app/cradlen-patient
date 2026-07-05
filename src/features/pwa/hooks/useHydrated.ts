"use client";

import { useSyncExternalStore } from "react";

const emptySubscribe = () => () => {};

/**
 * `false` on the server and during the hydration render (matching SSR HTML),
 * then `true`. Uses the same `useSyncExternalStore` mechanism as
 * `useMediaQuery`, which React hydrates via the server snapshot first — so
 * gating client-only UI on this never causes a hydration mismatch.
 */
export function useHydrated(): boolean {
  return useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false,
  );
}
