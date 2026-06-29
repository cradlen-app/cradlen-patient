"use client";

import { Bell, FlaskConical, Pill } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";

import { cn } from "@/common/utils/utils";
import { useRouter } from "@/i18n/navigation";
import { patientHref } from "@/components/common/patient-nav";
import { formatRelative } from "../lib/format";
import { useAllPatientNotifications } from "../hooks/usePatientNotifications";
import type { ApiPatientNotification } from "../data/patient-notifications.api.types";

/** Category → icon. Falls back to a generic bell. */
function iconFor(category: string) {
  switch (category) {
    case "medicine":
      return Pill;
    case "report":
      return FlaskConical;
    default:
      return Bell;
  }
}

function SkeletonRow() {
  return (
    <div className="flex items-start gap-3 rounded-2xl border border-gray-100 bg-white p-4">
      <div className="size-9 shrink-0 animate-pulse rounded-lg bg-gray-100" />
      <div className="flex-1 space-y-2">
        <div className="h-3 w-2/5 animate-pulse rounded bg-gray-100" />
        <div className="h-2.5 w-4/5 animate-pulse rounded bg-gray-100" />
      </div>
    </div>
  );
}

/** Full "see all" notifications list with load-more paging. */
export function NotificationsScreen() {
  const t = useTranslations("patientPortal");
  const locale = useLocale();
  const router = useRouter();
  const {
    entries,
    unreadCount,
    isLoading,
    isLoadingMore,
    hasMore,
    loadMore,
    markRead,
    markAllRead,
  } = useAllPatientNotifications();

  function onItemClick(n: ApiPatientNotification) {
    if (!n.is_read) markRead(n.id);
    if (n.navigate_to) {
      router.push(
        patientHref(n.navigate_to) as Parameters<typeof router.push>[0],
      );
    }
  }

  return (
    <div className="flex w-full flex-col gap-4 pb-24 lg:pb-0">
      <header className="flex items-center justify-between gap-3">
        <h1 className="text-lg font-bold text-brand-black">
          {t("notifications.title")}
        </h1>
        {unreadCount > 0 && (
          <button
            type="button"
            onClick={() => markAllRead()}
            className="text-xs font-semibold text-brand-primary transition-colors hover:text-brand-primary/80"
          >
            {t("notifications.markAllRead")}
          </button>
        )}
      </header>

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 6 }, (_, i) => (
            <SkeletonRow key={i} />
          ))}
        </div>
      ) : entries.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-2 py-16">
          <Bell className="size-10 text-gray-200" />
          <p className="text-sm font-semibold text-gray-600">
            {t("notifications.allCaughtUp")}
          </p>
          <p className="max-w-60 text-center text-xs leading-relaxed text-gray-400">
            {t("notifications.allCaughtUpSub")}
          </p>
        </div>
      ) : (
        <>
          <ul className="space-y-3">
            {entries.map((n) => {
              const Icon = iconFor(n.category);
              return (
                <li key={n.id}>
                  <button
                    type="button"
                    onClick={() => onItemClick(n)}
                    className={cn(
                      "flex w-full items-start gap-3 rounded-2xl border border-gray-100 bg-white p-4 text-start shadow-sm transition-colors hover:bg-gray-50",
                      !n.is_read && "bg-brand-primary/4",
                    )}
                  >
                    <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-brand-secondary/10 text-brand-primary">
                      <Icon className="size-4.5" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="flex items-center justify-between gap-2">
                        <span className="truncate text-sm font-semibold text-brand-black">
                          {n.title}
                        </span>
                        {!n.is_read && (
                          <span className="size-2 shrink-0 rounded-full bg-brand-primary" />
                        )}
                      </span>
                      <span className="mt-0.5 block text-xs text-gray-500">
                        {n.description}
                      </span>
                      <span className="mt-1 block text-[11px] text-gray-400">
                        {formatRelative(n.created_at, locale)}
                      </span>
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>

          {hasMore && (
            <div className="mt-1 flex justify-center">
              <button
                type="button"
                onClick={() => loadMore()}
                disabled={isLoadingMore}
                className="inline-flex h-9 items-center justify-center rounded-full bg-brand-primary px-6 text-xs font-semibold text-white hover:bg-brand-primary/90 disabled:opacity-60"
              >
                {isLoadingMore
                  ? t("common.loading")
                  : t("notifications.loadMore")}
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
