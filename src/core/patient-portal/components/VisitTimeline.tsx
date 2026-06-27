"use client";

import { useLocale, useTranslations } from "next-intl";
import type { ReactNode } from "react";

import { cn } from "@/common/utils/utils";
import { formatDate, formatDateParts } from "../lib/format";
import type { PortalVisit, VisitPriority } from "../types/patient-portal.types";
import { ClinicTag, EmptyState } from "./portal-ui";

/** A visit is "abnormal" when its priority is anything other than normal. */
function isAbnormal(priority: VisitPriority) {
  return priority !== "normal";
}

/** Green "Normal" / amber "Abnormal" pill derived from the visit priority. */
function StatusPill({ priority }: { priority: VisitPriority }) {
  const t = useTranslations("patientPortal");
  const abnormal = isAbnormal(priority);
  return (
    <span className="inline-flex items-center gap-1.5 text-xs text-gray-500">
      <span
        className={cn(
          "size-1.5 rounded-full",
          abnormal ? "bg-amber-500" : "bg-emerald-500",
        )}
        aria-hidden="true"
      />
      {t(abnormal ? "record.status.abnormal" : "record.status.normal")}
    </span>
  );
}

/**
 * One row of the visit timeline: a left date rail with a connector line and a
 * card slot on the right. Shared by the completed-visit timeline and the
 * upcoming-visit timeline so both read identically.
 */
export function TimelineItem({
  date,
  isLast,
  children,
}: {
  date: string;
  isLast: boolean;
  children: ReactNode;
}) {
  const locale = useLocale();
  return (
    <li className="flex items-stretch gap-4">
      <div className="relative flex w-20 flex-none items-center justify-center sm:w-24">
        {!isLast && (
          <span
            className="absolute inset-y-0 left-1/2 w-px -translate-x-1/2 bg-gray-200"
            aria-hidden="true"
          />
        )}
        <span className="relative whitespace-nowrap bg-white px-1 py-1 text-center text-xs font-medium text-gray-600">
          {formatDate(date, locale)}
        </span>
      </div>
      <div className={isLast ? "flex-1" : "flex-1 pb-6"}>{children}</div>
    </li>
  );
}

/** A labeled section inside a visit card (Diagnosis / Medications / …). */
function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="mt-3">
      <h4 className="text-[11px] font-semibold uppercase tracking-wide text-gray-400">
        {title}
      </h4>
      <div className="mt-1 space-y-0.5">{children}</div>
    </div>
  );
}

/**
 * A single completed-visit card body (without the timeline rail). Shared by the
 * date-rail history timeline (`VisitTimeline`) and the Journey → Episode → Visit
 * timeline (`JourneyTimeline`), both via {@link VisitRow}, which supplies the
 * date rail and status dot.
 */
export function VisitCard({ visit }: { visit: PortalVisit }) {
  const t = useTranslations("patientPortal");
  const priority = visit.priority ?? "normal";
  return (
    <article className="rounded-xl border border-gray-100 p-4">
      <header className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1">
        <span className="text-xs font-medium text-gray-700">
          {t(`record.typeLabel.${visit.type ?? "VISIT"}`)}
        </span>
        <StatusPill priority={priority} />
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs text-gray-500">
            {visit.doctorName} · {visit.specialty}
          </span>
          <ClinicTag clinic={visit.clinic} org={visit.organizationName} />
        </div>
      </header>

      {visit.diagnosis && (
        <Section title={t("record.diagnosis")}>
          <p className="text-xs text-brand-primary">{visit.diagnosis}</p>
        </Section>
      )}

      {visit.medications && visit.medications.length > 0 && (
        <Section title={t("record.medications")}>
          <div className="flex flex-wrap gap-x-4 gap-y-1">
            {visit.medications.map((m) => (
              <span key={m} className="text-xs text-brand-primary">
                {m}
              </span>
            ))}
          </div>
        </Section>
      )}

      {visit.investigations && visit.investigations.length > 0 && (
        <Section title={t("record.investigations")}>
          {visit.investigations.map((inv) => (
            <p key={inv} className="text-xs text-brand-primary">
              {inv}
            </p>
          ))}
        </Section>
      )}
    </article>
  );
}

/**
 * One completed-visit row: a left date rail ("14 Jun" over "2026") with a
 * status-colored node and connector line, and the {@link VisitCard} on the
 * right. Shared by the flat history timeline and the journey timeline so visits
 * read identically in both.
 */
export function VisitRow({
  visit,
  isLast,
}: {
  visit: PortalVisit;
  isLast: boolean;
}) {
  const locale = useLocale();
  const { dayMonth, year } = formatDateParts(visit.date, locale);
  const abnormal = isAbnormal(visit.priority ?? "normal");
  return (
    <li className="flex items-stretch gap-2">
      <div className="flex w-14 flex-none flex-col items-end pt-1.5 text-end sm:w-16">
        <span className="text-xs font-semibold text-gray-700">{dayMonth}</span>
        <span className="text-[11px] text-gray-400">{year}</span>
      </div>
      <div className="relative flex w-3 flex-none justify-center pt-2.5">
        {!isLast && (
          <span
            className="absolute inset-y-0 start-1/2 w-px -translate-x-1/2 bg-gray-200"
            aria-hidden="true"
          />
        )}
        <span
          className={cn(
            "relative z-10 size-2.5 rounded-full ring-4 ring-white",
            abnormal ? "bg-amber-500" : "bg-emerald-500",
          )}
          aria-hidden="true"
        />
      </div>
      <div className={cn("flex-1", isLast ? "" : "pb-5")}>
        <VisitCard visit={visit} />
      </div>
    </li>
  );
}

/** Loading placeholder that preserves the timeline shape. */
export function TimelineSkeletonItem({ isLast }: { isLast: boolean }) {
  return (
    <li className="flex items-stretch gap-4">
      <div className="relative flex w-20 flex-none items-center justify-center sm:w-24">
        {!isLast && (
          <span
            className="absolute inset-y-0 left-1/2 w-px -translate-x-1/2 bg-gray-200"
            aria-hidden="true"
          />
        )}
        <span className="relative h-3.5 w-16 animate-pulse rounded bg-gray-200" />
      </div>
      <div className={isLast ? "flex-1" : "flex-1 pb-6"}>
        <div className="space-y-3 rounded-xl border border-gray-100 p-4">
          <div className="h-3 w-24 animate-pulse rounded bg-gray-200" />
          <div className="h-3 w-40 animate-pulse rounded bg-gray-200" />
          <div className="h-3 w-32 animate-pulse rounded bg-gray-200" />
        </div>
      </div>
    </li>
  );
}

/** A centered "Load more" button shared by the timelines. */
export function TimelineLoadMore({
  isLoadingMore,
  loadMore,
}: {
  isLoadingMore: boolean;
  loadMore: () => void;
}) {
  const t = useTranslations("patientPortal");
  return (
    <div className="mt-2 flex justify-center">
      <button
        type="button"
        onClick={() => loadMore()}
        disabled={isLoadingMore}
        className="inline-flex h-9 items-center justify-center rounded-full bg-brand-primary px-6 text-xs font-semibold text-white hover:bg-brand-primary/90 disabled:opacity-60"
      >
        {isLoadingMore ? t("record.loading") : t("record.loadMore")}
      </button>
    </div>
  );
}

/**
 * Completed-visit timeline. Presentational: the caller supplies paged data from
 * `useVisitHistory`. Rendered both on the Record screen (inside a scroll
 * container via `listClassName`) and on the Visits page (natural height).
 */
export function VisitTimeline({
  entries,
  isLoading,
  hasMore,
  isLoadingMore,
  loadMore,
  listClassName,
}: {
  entries: PortalVisit[];
  isLoading: boolean;
  hasMore: boolean;
  isLoadingMore: boolean;
  loadMore: () => void;
  listClassName?: string;
}) {
  const t = useTranslations("patientPortal");

  return (
    <>
      <ol className={cn("space-y-0", listClassName)}>
        {isLoading ? (
          <>
            <TimelineSkeletonItem isLast={false} />
            <TimelineSkeletonItem isLast={false} />
            <TimelineSkeletonItem isLast={true} />
          </>
        ) : entries.length === 0 ? (
          <li>
            <EmptyState message={t("record.noVisits")} />
          </li>
        ) : (
          entries.map((visit, index) => (
            <VisitRow
              key={visit.id}
              visit={visit}
              isLast={index === entries.length - 1 && !hasMore}
            />
          ))
        )}
      </ol>

      {hasMore && (
        <TimelineLoadMore isLoadingMore={isLoadingMore} loadMore={loadMore} />
      )}
    </>
  );
}
