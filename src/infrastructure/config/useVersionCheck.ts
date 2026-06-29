"use client";

import { useQuery } from "@tanstack/react-query";
import { BUILD_INFO, isDevBuild } from "./build-info";

// Poll cadence: patients may keep the portal open for a while, so a 5-minute
// check is frequent enough to surface a deploy without hammering the endpoint.
// The check also re-runs on window focus (see below) so a returning user notices
// promptly.
const POLL_MS = 5 * 60 * 1000;

type VersionResponse = { buildId: string; version: string };

/**
 * Detects when a newer deployment is live by polling `/api/version` (which always
 * reports the deployment currently serving requests) and comparing its build id
 * to the one baked into this running bundle.
 *
 * Pass `enabled` (typically "is a patient signed in") so anonymous/public pages
 * don't poll. Never fires in dev builds, where the baked id is a non-deploy
 * sentinel that would otherwise mismatch every live response.
 */
export function useVersionCheck(enabled: boolean) {
  const { data } = useQuery({
    queryKey: ["app-version"],
    enabled: enabled && !isDevBuild,
    refetchInterval: POLL_MS,
    // Don't poll while the tab is hidden; the focus refetch covers re-entry.
    refetchIntervalInBackground: false,
    // Refetch on window focus so a returning patient gets a fresh check
    // immediately, regardless of the global query default.
    refetchOnWindowFocus: true,
    staleTime: 0,
    retry: 1,
    queryFn: async (): Promise<VersionResponse> => {
      const res = await fetch("/api/version", { cache: "no-store" });
      if (!res.ok) throw new Error("version check failed");
      return (await res.json()) as VersionResponse;
    },
  });

  const updateAvailable =
    !isDevBuild && Boolean(data?.buildId) && data!.buildId !== BUILD_INFO.buildId;

  return { updateAvailable, latestVersion: data?.version };
}
