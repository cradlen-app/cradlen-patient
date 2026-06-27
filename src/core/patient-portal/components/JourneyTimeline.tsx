"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";

import { cn } from "@/common/utils/utils";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { usePatientJourneyTimeline } from "../hooks/usePortalData";
import { formatDate } from "../lib/format";
import type {
  PortalJourneyTimelineEntry,
  PortalJourneyTimelineEpisode,
} from "../types/patient-portal.types";
import { EmptyState } from "./portal-ui";
import { TimelineLoadMore, VisitRow } from "./VisitTimeline";

/**
 * Patient-facing Journey → Episode → Visit timeline for the Visits page. Mirrors
 * the staff visit-workspace history (`features/visits/.../VisitsHistoryList`):
 * nested collapsibles, status dots, and a default-expanded active/newest journey
 * and its latest episode — but rendered in the portal's own styling, reusing the
 * portal {@link VisitCard} for each visit (with the date surfaced in the card).
 */

const STATUS_DOT: Record<string, string> = {
  ACTIVE: "bg-emerald-500",
  COMPLETED: "bg-gray-400",
  CANCELLED: "bg-red-500",
};

/** Marker + connector primitives shared by the timeline rail. */
const RAIL_LINE =
  "pointer-events-none absolute inset-y-0 start-[10px] w-px bg-gray-200";
const MARKER_SLOT =
  "relative z-10 flex size-[21px] flex-none items-center justify-center";

/** Seed the default expanded state: active (or newest) journey + its latest episode. */
function computeDefaults(journeys: PortalJourneyTimelineEntry[]) {
  const openJourneys = new Set<string>();
  const openEpisodes = new Set<string>();
  const focus = journeys.find((j) => j.status === "ACTIVE") ?? journeys[0];
  if (focus) {
    openJourneys.add(focus.id);
    const latest =
      focus.episodes.find((e) => e.status === "ACTIVE") ??
      [...focus.episodes].sort((a, b) => b.order - a.order)[0];
    if (latest) openEpisodes.add(latest.id);
  }
  return { openJourneys, openEpisodes };
}

function StatusBadge({ status }: { status: string }) {
  const t = useTranslations("patientPortal");
  return (
    <span className="inline-flex flex-none items-center gap-1.5 text-[11px] text-gray-500">
      <span
        className={cn("size-1.5 rounded-full", STATUS_DOT[status] ?? "bg-gray-400")}
        aria-hidden="true"
      />
      {t(`visits.status.${status}`)}
    </span>
  );
}

function EpisodeGroup({
  episode,
  open,
  onOpenChange,
  locale,
}: {
  episode: PortalJourneyTimelineEpisode;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  locale: string;
}) {
  const t = useTranslations("patientPortal");
  const meta = episode.startedAt
    ? `${t("visits.episodeStarted", {
        date: formatDate(episode.startedAt, locale),
      })} · ${
        episode.endedAt
          ? t("visits.completedOn", {
              date: formatDate(episode.endedAt, locale),
            })
          : t("visits.ongoing")
      }`
    : null;

  return (
    <Collapsible open={open} onOpenChange={onOpenChange} className="relative">
      <span className={RAIL_LINE} aria-hidden="true" />
      <CollapsibleTrigger className="group relative flex w-full items-center gap-2 py-2 text-start">
        <span className={MARKER_SLOT}>
          <span
            className="size-3 rounded-full border-2 border-brand-secondary bg-white"
            aria-hidden="true"
          />
        </span>
        <ChevronDown
          className="size-4 flex-none text-gray-400 transition-transform group-data-[state=closed]:-rotate-90"
          aria-hidden="true"
        />
        <div className="flex flex-1 flex-wrap items-baseline justify-between gap-x-3 gap-y-0.5">
          <span className="flex flex-wrap items-baseline gap-2">
            <span className="text-[11px] font-semibold uppercase tracking-wide text-brand-primary">
              {t("visits.episode", { order: episode.order })}
            </span>
            <span className="text-xs font-medium text-brand-black">
              {episode.name}
            </span>
            <span className="text-xs text-gray-400">
              · {t("visits.visitsCount", { count: episode.visits.length })}
            </span>
          </span>
          {meta && (
            <span className="flex-none text-[11px] text-gray-500">{meta}</span>
          )}
        </div>
      </CollapsibleTrigger>
      <CollapsibleContent>
        <div className="ps-7 pt-1">
          {episode.visits.length === 0 ? (
            <p className="py-2 text-xs text-gray-400">
              {t("visits.noVisitsInEpisode")}
            </p>
          ) : (
            <ol>
              {episode.visits.map((visit, i) => (
                <VisitRow
                  key={visit.id}
                  visit={visit}
                  isLast={i === episode.visits.length - 1}
                />
              ))}
            </ol>
          )}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}

function JourneyGroup({
  journey,
  openJourney,
  onJourneyOpenChange,
  openEpisodes,
  onEpisodeOpenChange,
  locale,
}: {
  journey: PortalJourneyTimelineEntry;
  openJourney: boolean;
  onJourneyOpenChange: (open: boolean) => void;
  openEpisodes: Set<string>;
  onEpisodeOpenChange: (id: string, open: boolean) => void;
  locale: string;
}) {
  const t = useTranslations("patientPortal");
  const visitsCount = journey.episodes.reduce(
    (n, e) => n + e.visits.length,
    0,
  );
  const meta = `${t("visits.journeyStarted", {
    date: formatDate(journey.startedAt, locale),
  })} · ${
    journey.endedAt
      ? t("visits.completedOn", {
          date: formatDate(journey.endedAt, locale),
        })
      : t("visits.ongoing")
  }`;

  return (
    <Collapsible
      open={openJourney}
      onOpenChange={onJourneyOpenChange}
      className="relative"
    >
      <span className={RAIL_LINE} aria-hidden="true" />
      <CollapsibleTrigger className="group relative flex w-full items-center gap-2 py-2.5 text-start">
        <span className={MARKER_SLOT}>
          <span
            className="size-3.5 rounded-full bg-brand-primary"
            aria-hidden="true"
          />
        </span>
        <ChevronDown
          className="size-4 flex-none text-brand-primary transition-transform group-data-[state=closed]:-rotate-90"
          aria-hidden="true"
        />
        <div className="flex flex-1 flex-wrap items-baseline justify-between gap-x-3 gap-y-0.5">
          <span className="flex flex-wrap items-baseline gap-2">
            <span className="text-sm font-semibold text-brand-black">
              {journey.name}
            </span>
            <span className="text-xs text-gray-400">
              {t("visits.episodesCount", { count: journey.episodes.length })} ·{" "}
              {t("visits.visitsCount", { count: visitsCount })}
            </span>
          </span>
          <span className="flex flex-wrap items-center gap-x-3 gap-y-0.5">
            <StatusBadge status={journey.status} />
            <span className="flex-none text-[11px] text-gray-500">{meta}</span>
          </span>
        </div>
      </CollapsibleTrigger>
      <CollapsibleContent>
        <div className="space-y-1 ps-7 pt-1">
          {journey.episodes.length === 0 ? (
            <p className="px-1 py-2 text-xs text-gray-400">
              {t("visits.noEpisodes")}
            </p>
          ) : (
            journey.episodes.map((episode) => (
              <EpisodeGroup
                key={episode.id}
                episode={episode}
                open={openEpisodes.has(episode.id)}
                onOpenChange={(o) => onEpisodeOpenChange(episode.id, o)}
                locale={locale}
              />
            ))
          )}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}

function JourneySkeleton() {
  return (
    <div className="space-y-3">
      {[0, 1].map((i) => (
        <div key={i} className="rounded-xl border border-gray-200 p-4">
          <div className="h-3.5 w-32 animate-pulse rounded bg-gray-200" />
          <div className="mt-3 space-y-2">
            <div className="h-3 w-40 animate-pulse rounded bg-gray-200" />
            <div className="h-3 w-28 animate-pulse rounded bg-gray-200" />
          </div>
        </div>
      ))}
    </div>
  );
}

/** The Journey → Episode → Visit timeline, fed by `usePatientJourneyTimeline`. */
export function JourneyTimeline() {
  const t = useTranslations("patientPortal");
  const locale = useLocale();
  const { entries, isLoading, hasMore, isLoadingMore, loadMore } =
    usePatientJourneyTimeline();

  const [seeded, setSeeded] = useState(false);
  const [openJourneys, setOpenJourneys] = useState<Set<string>>(new Set());
  const [openEpisodes, setOpenEpisodes] = useState<Set<string>>(new Set());

  // Seed default expanded state once, on first non-empty load — during render
  // (React's sanctioned pattern). Journeys pulled in later via "load more" stay
  // collapsed (not added to the sets).
  if (!seeded && entries.length > 0) {
    const defaults = computeDefaults(entries);
    setOpenJourneys(defaults.openJourneys);
    setOpenEpisodes(defaults.openEpisodes);
    setSeeded(true);
  }

  const toggleJourney = (id: string, open: boolean) =>
    setOpenJourneys((prev) => {
      const next = new Set(prev);
      if (open) next.add(id);
      else next.delete(id);
      return next;
    });

  const toggleEpisode = (id: string, open: boolean) =>
    setOpenEpisodes((prev) => {
      const next = new Set(prev);
      if (open) next.add(id);
      else next.delete(id);
      return next;
    });

  if (isLoading) return <JourneySkeleton />;
  if (entries.length === 0)
    return <EmptyState message={t("visits.noJourneys")} />;

  return (
    <>
      <div className="space-y-1">
        {entries.map((journey) => (
          <JourneyGroup
            key={journey.id}
            journey={journey}
            openJourney={openJourneys.has(journey.id)}
            onJourneyOpenChange={(o) => toggleJourney(journey.id, o)}
            openEpisodes={openEpisodes}
            onEpisodeOpenChange={toggleEpisode}
            locale={locale}
          />
        ))}
      </div>

      {hasMore && (
        <TimelineLoadMore isLoadingMore={isLoadingMore} loadMore={loadMore} />
      )}
    </>
  );
}
