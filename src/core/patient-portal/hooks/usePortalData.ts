"use client";

import { useInfiniteQuery, useQuery } from "@tanstack/react-query";

import {
  fetchAppointments,
  fetchDocuments,
  fetchHealthRecord,
  fetchLabOrders,
  fetchInvestigations,
  fetchMedications,
  fetchObgynHistory,
  fetchPatientJourney,
  fetchPatientJourneyTimeline,
  fetchReminders,
  fetchUpcomingVisits,
  fetchVisitHistory,
} from "../data/patient-portal.api";
import { patientPortalQueryKeys } from "../queryKeys";
import { useActivePatientId } from "./usePatientProfiles";

/**
 * Read hooks for the active patient profile. Each is keyed by the active
 * profile id so switching profiles fetches/caches independently.
 */

export function useHealthRecord() {
  const patientId = useActivePatientId();
  return useQuery({
    queryKey: patientPortalQueryKeys.healthRecord(patientId),
    queryFn: () => fetchHealthRecord(patientId),
  });
}

/**
 * Paginated visit history for the patient currently in view (newest first), as
 * an infinite query against the live endpoint. Scoped by the real backend
 * patient id (see `useResolvedPatientId`) and gated until that id resolves, so
 * the request never targets a stale fixture id.
 */
export function useVisitHistory() {
  const patientId = useResolvedPatientId();
  const query = useInfiniteQuery({
    queryKey: patientPortalQueryKeys.visitHistory(patientId ?? "none"),
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
 * the real backend patient id (see `useResolvedPatientId`) and gated until that
 * id resolves, mirroring `useVisitHistory`.
 */
export function useUpcomingVisits() {
  const patientId = useResolvedPatientId();
  const query = useInfiniteQuery({
    queryKey: patientPortalQueryKeys.upcomingVisits(patientId ?? "none"),
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
 * Paginated by journey (5 per page). Scoped by the real backend patient id (see
 * `useResolvedPatientId`) and gated until that id resolves, mirroring
 * `useVisitHistory`.
 */
export function usePatientJourneyTimeline() {
  const patientId = useResolvedPatientId();
  const query = useInfiniteQuery({
    queryKey: patientPortalQueryKeys.journeyTimeline(patientId ?? "none"),
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
 * by the real backend patient id (see `useResolvedPatientId`) and gated until
 * that id resolves, so the request never targets a stale fixture id.
 */
export function useInvestigations(
  filters: { status?: string; type?: string } = {},
) {
  const patientId = useResolvedPatientId();
  const query = useInfiniteQuery({
    queryKey: patientPortalQueryKeys.investigations(
      patientId ?? "none",
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
 * Minimal read of the patient identity (`patient_id`, `accessible_patient_ids`)
 * the `PatientNavbar` already loads via `usePatientMe()`. Subscribes to the same
 * query cache entry (`enabled: false`, no queryFn) so core never imports
 * `features/auth`.
 */
type PatientIdentityRead = {
  patient_id: string | null;
  accessible_patient_ids: string[];
};

function usePatientIdentity() {
  return useQuery<PatientIdentityRead>({
    queryKey: patientPortalQueryKeys.me(),
    enabled: false,
  });
}

/**
 * The real backend patient id for the patient currently in view, used by the
 * live (non-fixture) hooks. Resolves from the authenticated identity (not the
 * fixture profile store, so the other prototype screens are untouched): the
 * active profile id when it is a real accessible id, otherwise the account
 * holder (`patient_id`) or the first accessible patient. `undefined` while the
 * identity is still loading — callers gate their query with `enabled`.
 */
function useResolvedPatientId(): string | undefined {
  const { data: identity } = usePatientIdentity();
  const activeFixtureId = useActivePatientId();

  const accessible = identity?.accessible_patient_ids ?? [];
  return accessible.includes(activeFixtureId)
    ? activeFixtureId
    : (identity?.patient_id ?? accessible[0]);
}

/**
 * Live medications for the patient currently in view, scoped by the real
 * backend patient id and gated until that id resolves.
 */
export function useMedications() {
  const patientId = useResolvedPatientId();

  return useQuery({
    queryKey: patientPortalQueryKeys.medications(patientId ?? "none"),
    queryFn: () => fetchMedications(patientId as string),
    enabled: Boolean(patientId),
  });
}

/**
 * Read-only OB/GYN history (display-ready groups) for the patient currently in
 * view, scoped by the real backend patient id and gated until it resolves.
 */
export function usePatientHistory() {
  const patientId = useResolvedPatientId();

  return useQuery({
    queryKey: patientPortalQueryKeys.history(patientId ?? "none"),
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
  const patientId = useResolvedPatientId();

  return useQuery({
    queryKey: patientPortalQueryKeys.journey(patientId ?? "none"),
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
    isLoading: meds.isLoading || tests.isLoading || visits.isLoading,
  };
}

export function useLabOrders() {
  const patientId = useActivePatientId();
  return useQuery({
    queryKey: patientPortalQueryKeys.labOrders(patientId),
    queryFn: () => fetchLabOrders(patientId),
  });
}

export function useDocuments() {
  const patientId = useActivePatientId();
  return useQuery({
    queryKey: patientPortalQueryKeys.documents(patientId),
    queryFn: () => fetchDocuments(patientId),
  });
}

export function useAppointments() {
  const patientId = useActivePatientId();
  return useQuery({
    queryKey: patientPortalQueryKeys.appointments(patientId),
    queryFn: () => fetchAppointments(patientId),
  });
}

export function useReminders() {
  const patientId = useActivePatientId();
  return useQuery({
    queryKey: [...patientPortalQueryKeys.home(patientId), "reminders"],
    queryFn: () => fetchReminders(patientId),
  });
}
