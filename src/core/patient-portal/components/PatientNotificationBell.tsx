"use client";

import { Popover } from "radix-ui";
import { Bell, FlaskConical, Pill } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";

import { cn } from "@/common/utils/utils";
import { Link, useRouter } from "@/i18n/navigation";
import { patientHref } from "@/components/common/patient-nav";
import { formatRelative } from "../lib/format";
import { usePatientNotifications } from "../hooks/usePatientNotifications";
import type { ApiPatientNotification } from "../data/patient-notifications.api.types";

const DROPDOWN_ROWS = 8;

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
    <div className="flex items-start gap-2.5 border-b border-gray-50 px-4 py-2.5">
      <div className="size-8 shrink-0 animate-pulse rounded-lg bg-gray-100" />
      <div className="flex-1 space-y-1.5">
        <div className="h-2.5 w-4/5 animate-pulse rounded bg-gray-100" />
        <div className="h-2 w-3/5 animate-pulse rounded bg-gray-100" />
      </div>
    </div>
  );
}

/**
 * Patient portal notification bell — a self-contained dropdown over the live
 * `/api/patient-portal/notifications` feed. Mirrors the staff dropdown's look but
 * patient-scoped (cookie auth, patient query keys).
 */
export function PatientNotificationBell() {
  const t = useTranslations("patientPortal");
  const locale = useLocale();
  const router = useRouter();
  const { notifications, unreadCount, isLoading, markRead, markAllRead } =
    usePatientNotifications();

  function onItemClick(n: ApiPatientNotification) {
    if (!n.is_read) markRead(n.id);
    if (n.navigate_to) {
      router.push(
        patientHref(n.navigate_to) as Parameters<typeof router.push>[0],
      );
    }
  }

  const badge =
    unreadCount === 0 ? undefined : unreadCount > 99 ? "99+" : String(unreadCount);

  return (
    <Popover.Root>
      <Popover.Trigger asChild>
        <button
          type="button"
          aria-label={t("notifications.title")}
          className={cn(
            "relative flex size-9 items-center justify-center rounded-full",
            "text-gray-400 transition-all duration-150 hover:bg-brand-primary/8 hover:text-brand-primary",
            "data-[state=open]:bg-brand-primary/8 data-[state=open]:text-brand-primary",
          )}
        >
          <Bell className="size-5" />
          {badge && (
            <span className="absolute top-0.5 inset-e-0.5 flex h-4.25 min-w-4.25 items-center justify-center rounded-full border-[1.5px] border-white bg-brand-primary px-1 text-[9px] font-bold leading-none text-white">
              {badge}
            </span>
          )}
        </button>
      </Popover.Trigger>

      <Popover.Portal>
        <Popover.Content
          align="end"
          sideOffset={8}
          collisionPadding={12}
          className={cn(
            "z-50 w-[min(22rem,calc(100vw-1.5rem))] rounded-2xl border border-gray-100 bg-white outline-none",
            "shadow-[0_8px_32px_rgba(0,0,0,0.12),0_2px_8px_rgba(0,0,0,0.06)]",
            "data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95",
            "data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95",
          )}
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-gray-50 px-4 py-3">
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-gray-900">
                {t("notifications.title")}
              </span>
              {unreadCount > 0 && (
                <span className="text-xs text-gray-400">
                  {t("notifications.unreadCount", { count: unreadCount })}
                </span>
              )}
            </div>
            {unreadCount > 0 && (
              <button
                type="button"
                onClick={() => markAllRead()}
                className="text-[11px] font-semibold text-brand-primary transition-colors hover:text-brand-primary/80"
              >
                {t("notifications.markAllRead")}
              </button>
            )}
          </div>

          {/* Body */}
          <div className="max-h-80 overflow-y-auto">
            {isLoading ? (
              Array.from({ length: DROPDOWN_ROWS }, (_, i) => (
                <SkeletonRow key={i} />
              ))
            ) : notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center gap-2 py-10">
                <Bell className="size-9 text-gray-200" />
                <p className="text-sm font-semibold text-gray-600">
                  {t("notifications.allCaughtUp")}
                </p>
                <p className="max-w-50 text-center text-xs leading-relaxed text-gray-400">
                  {t("notifications.allCaughtUpSub")}
                </p>
              </div>
            ) : (
              notifications.map((n) => {
                const Icon = iconFor(n.category);
                return (
                  <button
                    key={n.id}
                    type="button"
                    onClick={() => onItemClick(n)}
                    className={cn(
                      "flex w-full items-start gap-2.5 border-b border-gray-50 px-4 py-2.5 text-start transition-colors hover:bg-gray-50",
                      !n.is_read && "bg-brand-primary/4",
                    )}
                  >
                    <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-brand-secondary/10 text-brand-primary">
                      <Icon className="size-4" />
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
                      <span className="mt-0.5 line-clamp-2 block text-xs text-gray-500">
                        {n.description}
                      </span>
                      <span className="mt-0.5 block text-[11px] text-gray-400">
                        {formatRelative(n.created_at, locale)}
                      </span>
                    </span>
                  </button>
                );
              })
            )}
          </div>

          {/* Footer */}
          <div className="border-t border-gray-50 px-4 py-2.5 text-center">
            <Popover.Close asChild>
              <Link
                href="/patient/notifications"
                className="text-xs font-semibold text-brand-primary transition-colors hover:text-brand-primary/80"
              >
                {t("notifications.seeAll")}
              </Link>
            </Popover.Close>
          </div>
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
}
