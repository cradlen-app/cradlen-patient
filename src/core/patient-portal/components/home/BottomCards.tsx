"use client";

import { CalendarDays, FlaskConical, Pill } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";

import { cn } from "@/common/utils/utils";
import { formatDate, formatDayMonth } from "../../lib/format";
import {
  useInvestigations,
  useMedications,
  useUpcomingVisits,
} from "../../hooks/usePortalData";
import type { LabCategory } from "../../types/patient-portal.types";
import { StatusBadge } from "../portal-ui";
import { HomeCard, HomeCardHeader } from "./HomeCard";

/** First letter of the first two name parts (after stripping a "Dr." prefix). */
function initials(name: string): string {
  return name
    .replace(/^(dr\.?|د\.?)\s*/i, "")
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("");
}

function formatTime(iso: string | undefined, locale: string): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return new Intl.DateTimeFormat(locale, {
    hour: "2-digit",
    minute: "2-digit",
  }).format(d);
}

function CardEmpty({ message }: { message: string }) {
  return <p className="py-6 text-sm text-gray-400">{message}</p>;
}

/** The next recommended follow-up: doctor identity + date/time pill. */
function UpcomingVisitCard() {
  const t = useTranslations("patientPortal");
  const locale = useLocale();
  const { entries, isLoading } = useUpcomingVisits();
  const next = entries[0];

  return (
    <HomeCard>
      <HomeCardHeader title={t("home.upcomingVisitTitle")} />
      {isLoading ? (
        <CardEmpty message={t("common.loading")} />
      ) : !next ? (
        <CardEmpty message={t("home.noUpcoming")} />
      ) : (
        <>
          <div className="flex items-center gap-3">
            <span className="flex size-10 items-center justify-center rounded-full bg-brand-primary/10 text-sm font-semibold text-brand-primary">
              {initials(next.doctorName) || "Dr"}
            </span>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-brand-black">
                {next.doctorName || "—"}
              </p>
              <p className="truncate text-xs text-gray-500">{next.specialty}</p>
            </div>
          </div>
          <div className="mt-4 flex items-center gap-2 rounded-xl bg-gray-50 px-3 py-2.5 text-sm font-medium text-brand-black">
            <CalendarDays className="size-4 text-brand-primary" />
            <span>
              {formatDayMonth(next.date, locale)}
              {formatTime(next.date, locale) && ` · ${formatTime(next.date, locale)}`}
            </span>
          </div>
          <p className="mt-3 text-xs text-gray-400">{t("home.followUpVisit")}</p>
        </>
      )}
    </HomeCard>
  );
}

const CATEGORY_LABEL: Record<LabCategory, string> = {
  lab: "home.categoryLab",
  imaging: "home.categoryImaging",
  other: "home.categoryOther",
};

/** The most recent ordered test with its review status. */
function RecentTestCard() {
  const t = useTranslations("patientPortal");
  const locale = useLocale();
  const { entries, isLoading } = useInvestigations();
  const test = entries[0];

  return (
    <HomeCard>
      <HomeCardHeader
        title={t("home.recentTestTitle")}
        action={
          test && (
            <StatusBadge
              label={
                test.status === "reviewed"
                  ? t("home.testReviewed")
                  : t("home.testPending")
              }
              tone={test.status === "reviewed" ? "green" : "amber"}
            />
          )
        }
      />
      {isLoading ? (
        <CardEmpty message={t("common.loading")} />
      ) : !test ? (
        <CardEmpty message={t("home.noRecentTest")} />
      ) : (
        <>
          <div className="flex items-center gap-3">
            <span className="flex size-10 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
              <FlaskConical className="size-5" />
            </span>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-brand-black">
                {test.name}
              </p>
              <p className="truncate text-xs text-gray-500">
                {t(CATEGORY_LABEL[test.category])}
              </p>
            </div>
          </div>
          <p className="mt-4 truncate text-xs text-gray-500">{test.doctorName}</p>
          <p className="text-xs text-gray-400">{formatDate(test.date, locale)}</p>
        </>
      )}
    </HomeCard>
  );
}

/** Up to two active medications with a dose/frequency line + class badge. */
function MyMedicationsCard() {
  const t = useTranslations("patientPortal");
  const { data: meds, isLoading } = useMedications();
  const active = (meds ?? []).filter((m) => m.status === "active").slice(0, 2);

  return (
    <HomeCard>
      <HomeCardHeader
        title={t("home.myMedicationsTitle")}
        viewAllHref="/patient/medications"
        viewAllLabel={t("home.viewAll")}
      />
      {isLoading ? (
        <CardEmpty message={t("common.loading")} />
      ) : active.length === 0 ? (
        <CardEmpty message={t("medications.none")} />
      ) : (
        <ul className="space-y-3">
          {active.map((m) => (
            <li key={m.id} className="flex items-center gap-3">
              <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-brand-secondary/15 text-brand-primary">
                <Pill className="size-4" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-brand-black">
                  {m.name}
                </p>
                <p className="truncate text-xs text-gray-500">
                  {[m.dose, m.frequency].filter(Boolean).join(" · ")}
                </p>
              </div>
              {m.category && (
                <span
                  className={cn(
                    "shrink-0 rounded-full bg-gray-100 px-2 py-0.5 text-[11px] font-medium capitalize text-gray-600",
                  )}
                >
                  {m.category}
                </span>
              )}
            </li>
          ))}
        </ul>
      )}
    </HomeCard>
  );
}

/** The home's bottom row: upcoming visit, recent test, active medications. */
export function BottomCards() {
  return (
    <div className="grid gap-4 lg:grid-cols-3">
      <UpcomingVisitCard />
      <RecentTestCard />
      <MyMedicationsCard />
    </div>
  );
}
