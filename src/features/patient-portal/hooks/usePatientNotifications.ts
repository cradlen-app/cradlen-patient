"use client";

import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";

import {
  fetchPatientNotifications,
  fetchPatientNotificationsPage,
  markAllPatientNotificationsRead,
  markPatientNotificationRead,
} from "../data/patient-portal.api";
import { patientPortalQueryKeys } from "../queryKeys";
import type { ApiPatientNotification } from "../data/patient-notifications.api.types";

const DROPDOWN_LIMIT = 8;
const PAGE_LIMIT = 20;

/**
 * Patient notifications for the bell dropdown: the recent list + unread count,
 * with mark-read / mark-all-read mutations. Polls every 60s so new notifications
 * (e.g. after a completed visit) appear without a reload. Patient-scoped via the
 * `/api/patient-portal/notifications` proxy (cookie auth), not the staff feed.
 */
export function usePatientNotifications() {
  const queryClient = useQueryClient();
  const queryKey = patientPortalQueryKeys.notifications();

  const { data, isLoading } = useQuery({
    queryKey,
    queryFn: () => fetchPatientNotifications({ limit: DROPDOWN_LIMIT }),
    refetchInterval: 60_000,
  });

  const invalidate = () => queryClient.invalidateQueries({ queryKey });

  const markRead = useMutation({
    mutationFn: (id: string) => markPatientNotificationRead(id),
    onSuccess: invalidate,
  });

  const markAllRead = useMutation({
    mutationFn: () => markAllPatientNotificationsRead(),
    onSuccess: invalidate,
  });

  const notifications: ApiPatientNotification[] = data?.data ?? [];

  return {
    notifications,
    unreadCount: data?.meta?.unreadCount ?? 0,
    isLoading,
    markRead: (id: string) => markRead.mutate(id),
    markAllRead: () => markAllRead.mutate(),
  };
}

/**
 * The full, paginated notifications list for the "See all" page. Infinite query
 * over `/patient-portal/notifications?page&limit`; mark-read mutations invalidate
 * the shared `notifications` root so both this list and the bell dropdown refresh.
 */
export function useAllPatientNotifications() {
  const queryClient = useQueryClient();
  const rootKey = patientPortalQueryKeys.notifications();

  const query = useInfiniteQuery({
    queryKey: patientPortalQueryKeys.notificationsAll(),
    queryFn: ({ pageParam }) =>
      fetchPatientNotificationsPage({ page: pageParam, limit: PAGE_LIMIT }),
    initialPageParam: 1,
    getNextPageParam: (lastPage, allPages) => {
      const loaded = allPages.flatMap((p) => p.data).length;
      return loaded < lastPage.meta.total ? allPages.length + 1 : undefined;
    },
  });

  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: rootKey });

  const markRead = useMutation({
    mutationFn: (id: string) => markPatientNotificationRead(id),
    onSuccess: invalidate,
  });

  const markAllRead = useMutation({
    mutationFn: () => markAllPatientNotificationsRead(),
    onSuccess: invalidate,
  });

  const entries: ApiPatientNotification[] =
    query.data?.pages.flatMap((p) => p.data) ?? [];

  return {
    entries,
    unreadCount: query.data?.pages[0]?.meta.unreadCount ?? 0,
    isLoading: query.isLoading,
    isLoadingMore: query.isFetchingNextPage,
    hasMore: query.hasNextPage,
    loadMore: query.fetchNextPage,
    markRead: (id: string) => markRead.mutate(id),
    markAllRead: () => markAllRead.mutate(),
  };
}
