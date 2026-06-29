"use client";

import { useInfiniteQuery, useQuery } from "@tanstack/react-query";

import {
  fetchInvestigations,
  fetchMedications,
  fetchObgynHistory,
  fetchPatientJourney,
  fetchPatientJourneyTimeline,
  fetchUpcomingVisits,
  fetchVisitHistory,
} from "../data/patient-portal.api";
import { patientPortalQueryKeys } from "../queryKeys";
import { useActivePatientId, usePatientProfiles } from "./usePatientProfiles";

/**
 * Read hooks for the active patient profile. Each is keyed by the active
 * profile id so switching profiles fetches/caches independently.
 */

/**
 * Paginated visit history for the patient currently in view (newest first), as
 * an infinite query against the live endpoint. Scoped by the real backend
 * patient id (the active profile) and gated until it resolves, so
 * the request never targets a stale fixture id.
 */
export function useVisitHistory() {
  const patientId = useActivePatientId();
  const query = useInfiniteQuery({
    queryKey: patientPortalQueryKeys.visitHistory(patientId || "none"),
    queryFn: ({ pageParam }) =>
      fetchVisitHistory({
        patientId: patientId as string,
        page: pageParam,
        limit: 10,
      }),
    initialPageParam: 1,
    getNextPageParam: (lastPage, allPages) => {
      const loaded = allPages.flatMap((p) => p.data).length;
      return loaded < lastPage.meta.total ? allPages.length + 1 : undefined;
    },
    enabled: Boolean(patientId),
  });

  const entries = query.data?.pages.flatMap((p) => p.data) ?? [];

  return {
    entries,
    isLoading: query.isLoading,
    isLoadingMore: query.isFetchingNextPage,
    hasMore: query.hasNextPage,
    loadMore: query.fetchNextPage,
  };
}

/**
 * Paginated upcoming recommended follow-ups for the patient currently in view
 * (soonest first), as an infinite query against the live endpoint. Scoped by
 * the real backend patient id (the active profile) and gated until it
 * resolves, mirroring `useVisitHistory`.
 */
export function useUpcomingVisits() {
  const patientId = useActivePatientId();
  const query = useInfiniteQuery({
    queryKey: patientPortalQueryKeys.upcomingVisits(patientId || "none"),
    queryFn: ({ pageParam }) =>
      fetchUpcomingVisits({
        patientId: patientId as string,
        page: pageParam,
        limit: 10,
      }),
    initialPageParam: 1,
    getNextPageParam: (lastPage, allPages) => {
      const loaded = allPages.flatMap((p) => p.data).length;
      return loaded < lastPage.meta.total ? allPages.length + 1 : undefined;
    },
    enabled: Boolean(patientId),
  });

  const entries = query.data?.pages.flatMap((p) => p.data) ?? [];

  return {
    entries,
    isLoading: query.isLoading,
    isLoadingMore: query.isFetchingNextPage,
    hasMore: query.hasNextPage,
    loadMore: query.fetchNextPage,
  };
}

/**
 * Paginated Journey → Episode → Visit timeline for the patient currently in view
 * (journeys newest first), as an infinite query against the live endpoint.
 * Paginated by journey (5 per page). Scoped by the real backend patient id
 * (the active profile) and gated until it resolves, mirroring `useVisitHistory`.
 */
export function usePatientJourneyTimeline() {
  const patientId = useActivePatientId();
  const query = useInfiniteQuery({
    queryKey: patientPortalQueryKeys.journeyTimeline(patientId || "none"),
    queryFn: ({ pageParam }) =>
      fetchPatientJourneyTimeline({
        patientId: patientId as string,
        page: pageParam,
        limit: 5,
      }),
    initialPageParam: 1,
    getNextPageParam: (lastPage, allPages) => {
      const loaded = allPages.flatMap((p) => p.data).length;
      return loaded < lastPage.meta.total ? allPages.length + 1 : undefined;
    },
    enabled: Boolean(patientId),
  });

  const entries = query.data?.pages.flatMap((p) => p.data) ?? [];

  return {
    entries,
    isLoading: query.isLoading,
    isLoadingMore: query.isFetchingNextPage,
    hasMore: query.hasNextPage,
    loadMore: query.fetchNextPage,
  };
}

/**
 * Paginated investigations (lab tests & imaging) for the patient currently in
 * view (newest first), as an infinite query against the live endpoint. Scoped
 * by the real backend patient id (the active profile) and gated until it
 * resolves, so the request never targets a stale fixture id.
 */
export function useInvestigations(
  filters: { status?: string; type?: string } = {},
) {
  const patientId = useActivePatientId();
  const query = useInfiniteQuery({
    queryKey: patientPortalQueryKeys.investigations(
      patientId || "none",
      filters.status,
      filters.type,
    ),
    queryFn: ({ pageParam }) =>
      fetchInvestigations({
        patientId: patientId as string,
        page: pageParam,
        limit: 10,
        status: filters.status,
        type: filters.type,
      }),
    initialPageParam: 1,
    getNextPageParam: (lastPage, allPages) => {
      const loaded = allPages.flatMap((p) => p.data).length;
      return loaded < lastPage.meta.total ? allPages.length + 1 : undefined;
    },
    enabled: Boolean(patientId),
  });

  const entries = query.data?.pages.flatMap((p) => p.data) ?? [];

  return {
    entries,
    isLoading: query.isLoading,
    isLoadingMore: query.isFetchingNextPage,
    hasMore: query.hasNextPage,
    loadMore: query.fetchNextPage,
  };
}

/**
 * Live medications for the patient currently in view, scoped by the real
 * backend patient id and gated until that id resolves.
 */
export function useMedications() {
  const patientId = useActivePatientId();

  return useQuery({
    queryKey: patientPortalQueryKeys.medications(patientId || "none"),
    queryFn: () => fetchMedications(patientId as string),
    enabled: Boolean(patientId),
  });
}

/**
 * Read-only OB/GYN history (display-ready groups) for the patient currently in
 * view, scoped by the real backend patient id and gated until it resolves.
 */
export function usePatientHistory() {
  const patientId = useActivePatientId();

  return useQuery({
    queryKey: patientPortalQueryKeys.history(patientId || "none"),
    queryFn: () => fetchObgynHistory(patientId as string),
    enabled: Boolean(patientId),
  });
}

/**
 * The patient's single active journey (care-path type, ordered stages, optional
 * pregnancy block) for the home dashboard, scoped by the real backend patient
 * id and gated until it resolves. `data` is null when the patient has no active
 * journey — the home then renders its generic/empty states.
 */
export function usePatientJourney() {
  const patientId = useActivePatientId();

  return useQuery({
    queryKey: patientPortalQueryKeys.journey(patientId || "none"),
    queryFn: () => fetchPatientJourney(patientId as string),
    enabled: Boolean(patientId),
  });
}

/** Counts backing the home "Don't forget today" card. */
export interface HomeSummary {
  /** Active medications. */
  medicines: number;
  /** Tests awaiting a result/review (not yet reviewed). */
  tests: number;
  /** Upcoming recommended follow-ups (the backend returns future-only). */
  nextVisit: number;
  /** How many of the three rows have something to act on. */
  needAttention: number;
  isLoading: boolean;
}

/**
 * Derives the home "Don't forget today" counts purely from the existing live
 * endpoints (medications, investigations, upcoming visits) — no dedicated
 * aggregate endpoint. The upcoming-visits endpoint already filters to future
 * follow-ups, so its length is the actionable count. `needAttention` is how
 * many of the three rows are non-empty, matching the "N need attention" header.
 */
export function useHomeSummary(): HomeSummary {
  // The three queries below are *disabled* (not "loading") until the active
  // patient id resolves from the profiles list, so without this the card flashes
  // its zeroed "all clear" state during the cold-start identity load.
  // `isPending` is true while the profiles query is resolving and false once it
  // has data OR errors (so a failed identity doesn't leave an eternal skeleton).
  const profiles = usePatientProfiles();
  const meds = useMedications();
  const tests = useInvestigations();
  const visits = useUpcomingVisits();

  const medicines = (meds.data ?? []).filter((m) => m.status === "active").length;
  const pendingTests = tests.entries.filter((t) => t.status === "pending").length;
  const nextVisit = visits.entries.length;

  const needAttention = [medicines, pendingTests, nextVisit].filter(
    (c) => c > 0,
  ).length;

  return {
    medicines,
    tests: pendingTests,
    nextVisit,
    needAttention,
    isLoading:
      profiles.isPending ||
      meds.isLoading ||
      tests.isLoading ||
      visits.isLoading,
  };
}

