"use client";

import { useTranslations } from "next-intl";

import { useUpcomingVisits } from "../hooks/usePortalData";
import type { PortalUpcomingVisit } from "../types/patient-portal.types";
import { JourneyTimeline } from "./JourneyTimeline";
import { ClinicTag, CollapsibleCard, EmptyState, ScreenHeader } from "./portal-ui";
import {
  TimelineItem,
  TimelineLoadMore,
  TimelineSkeletonItem,
} from "./VisitTimeline";

/**
 * Patient portal Visits page. Stacks two collapsible sections: upcoming
 * recommended follow-ups (open by default) and the completed-visit history
 * (collapsed). The history mirrors the staff visit-workspace timeline —
 * Journey → Episode → Visit — via {@link JourneyTimeline}, so a patient sees
 * their care grouped by journey and episode rather than as a flat list.
 */
export function VisitsScreen() {
  const t = useTranslations("patientPortal");

  return (
    <div className="flex w-full flex-col gap-4 pb-24 lg:pb-0">
      <ScreenHeader title={t("visits.title")} />

      <CollapsibleCard title={t("visits.upcomingTitle")} defaultOpen>
        <UpcomingVisitsTimeline />
      </CollapsibleCard>

      <CollapsibleCard title={t("visits.lastTitle")}>
        <JourneyTimeline />
      </CollapsibleCard>
    </div>
  );
}

/** Upcoming recommended follow-ups from the live endpoint, as a timeline. */
function UpcomingVisitsTimeline() {
  const t = useTranslations("patientPortal");
  const { entries, isLoading, hasMore, isLoadingMore, loadMore } =
    useUpcomingVisits();

  return (
    <>
      <ol className="space-y-0">
        {isLoading ? (
          <>
            <TimelineSkeletonItem isLast={false} />
            <TimelineSkeletonItem isLast={true} />
          </>
        ) : entries.length === 0 ? (
          <li>
            <EmptyState message={t("visits.noUpcoming")} />
          </li>
        ) : (
          entries.map((visit, index) => (
            <TimelineItem
              key={visit.id}
              date={visit.date}
              isLast={index === entries.length - 1 && !hasMore}
            >
              <UpcomingVisitCard visit={visit} />
            </TimelineItem>
          ))
        )}
      </ol>

      {hasMore && (
        <TimelineLoadMore isLoadingMore={isLoadingMore} loadMore={loadMore} />
      )}
    </>
  );
}

/** A single upcoming follow-up card body (without the timeline rail). */
function UpcomingVisitCard({ visit }: { visit: PortalUpcomingVisit }) {
  const t = useTranslations("patientPortal");
  const hasDoctor = Boolean(visit.doctorName || visit.specialty);
  return (
    <article className="rounded-xl border border-gray-100 p-4">
      <header className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1">
        <span className="text-xs font-medium text-brand-primary">
          {t("visits.followUp")}
        </span>
        <div className="flex flex-wrap items-center gap-2">
          {hasDoctor && (
            <span className="text-xs text-gray-500">
              {[visit.doctorName, visit.specialty].filter(Boolean).join(" · ")}
            </span>
          )}
          <ClinicTag clinic={visit.clinic} org={visit.organizationName} />
        </div>
      </header>

      {visit.note && (
        <p className="mt-3 text-xs text-gray-700">{visit.note}</p>
      )}
    </article>
  );
}
