"use client";

import type { LucideIcon } from "lucide-react";
import { CalendarDays, FlaskConical, Pill } from "lucide-react";
import { useTranslations } from "next-intl";

import { cn } from "@/common/utils/utils";
import { Link } from "@/i18n/navigation";
import { useHomeSummary } from "../../hooks/usePortalData";
import { HomeCard, HomeCardHeader } from "./HomeCard";

type Row = {
  href: string;
  icon: LucideIcon;
  tint: string;
  title: string;
  sub: string;
  count: number;
};

function TodayRow({ row }: { row: Row }) {
  const { icon: Icon } = row;
  const attention = row.count > 0;
  return (
    <Link
      href={row.href as Parameters<typeof Link>[0]["href"]}
      className="flex items-center gap-3 rounded-xl bg-gray-50 px-3 py-3 transition-colors hover:bg-gray-100"
    >
      <span
        className={cn(
          "flex size-9 items-center justify-center rounded-lg",
          row.tint,
        )}
      >
        <Icon className="size-4" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-semibold text-brand-black">
          {row.title}
        </span>
        <span className="block truncate text-xs text-gray-500">{row.sub}</span>
      </span>
      <span
        className={cn(
          "text-lg font-bold",
          attention ? "text-brand-primary" : "text-gray-300",
        )}
      >
        {row.count}
      </span>
    </Link>
  );
}

/**
 * "Don't forget today" — three actionable rows (medicines, tests, next visit)
 * with counts derived client-side via {@link useHomeSummary}. The header tally
 * is how many rows have something to act on.
 */
export function TodayCard() {
  const t = useTranslations("patientPortal");
  const summary = useHomeSummary();

  const rows: Row[] = [
    {
      href: "/patient/medications",
      icon: Pill,
      tint: "bg-brand-secondary/20 text-brand-primary",
      title: t("home.todayMedicines"),
      sub: t("home.todayMedicinesSub", { count: summary.medicines }),
      count: summary.medicines,
    },
    {
      href: "/patient/tests",
      icon: FlaskConical,
      tint: "bg-amber-100 text-amber-700",
      title: t("home.todayTests"),
      sub: t("home.todayTestsSub", { count: summary.tests }),
      count: summary.tests,
    },
    {
      href: "/patient/visits",
      icon: CalendarDays,
      tint: "bg-rose-100 text-rose-600",
      title: t("home.todayNextVisit"),
      sub: t("home.todayNextVisitSub", { count: summary.nextVisit }),
      count: summary.nextVisit,
    },
  ];

  return (
    <HomeCard className="h-full">
      <HomeCardHeader
        title={t("home.todayTitle")}
        action={
          <span className="text-xs font-medium text-amber-600">
            {summary.needAttention > 0
              ? t("home.todayNeedAttention", { count: summary.needAttention })
              : t("home.todayAllClear")}
          </span>
        }
      />
      <div className="space-y-2.5">
        {rows.map((row) => (
          <TodayRow key={row.href} row={row} />
        ))}
      </div>
    </HomeCard>
  );
}
