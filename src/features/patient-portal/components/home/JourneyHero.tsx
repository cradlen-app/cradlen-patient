"use client";

import { useLocale, useTranslations } from "next-intl";
import { Activity } from "lucide-react";

import { formatDate } from "../../lib/format";
import type {
  PortalJourney,
  PortalPregnancy,
} from "../../types/patient-portal.types";
import { GestationRing } from "./GestationRing";

const HERO_SHELL =
  "rounded-2xl bg-gradient-to-br from-brand-primary to-brand-primary/85 p-6 text-white shadow-sm";

/** Pill badge on the dark hero (translucent white). */
function HeroBadge({ label }: { label: string }) {
  return (
    <span className="inline-flex items-center rounded-full bg-white/15 px-3 py-1 text-xs font-semibold text-white">
      {label}
    </span>
  );
}

/** The "Fetuses" / "Due date" stat under the week heading. */
function HeroFact({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0">
      <p className="text-xs text-white/60">{label}</p>
      <p className="mt-0.5 truncate text-sm font-semibold">{value}</p>
    </div>
  );
}

function pregnancyTypeKey(type?: string): string {
  switch (type) {
    case "twin":
      return "home.twinPregnancy";
    case "multiple":
      return "home.multiplePregnancy";
    default:
      return "home.singletonPregnancy";
  }
}

function PregnancyHero({
  pregnancy,
  total = 40,
}: {
  pregnancy: PortalPregnancy;
  total?: number;
}) {
  const t = useTranslations("patientPortal");
  const locale = useLocale();
  const weeks = pregnancy.weeks ?? 0;

  return (
    <div className={HERO_SHELL}>
      <div className="flex items-center gap-6">
        <GestationRing current={weeks} total={total} unit={t("home.wks")} />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap gap-2">
            <HeroBadge label={t(pregnancyTypeKey(pregnancy.pregnancyType))} />
            {pregnancy.riskLevel === "high" && (
              <HeroBadge label={t("home.highRisk")} />
            )}
          </div>
          <h2 className="mt-3 text-2xl font-bold">
            {t("home.weekOf", { current: weeks, total })}
          </h2>
          <div className="mt-4 grid grid-cols-2 gap-4">
            <HeroFact
              label={t("home.fetuses")}
              value={
                pregnancy.fetusCount
                  ? t("home.fetusesValue", {
                      count: pregnancy.fetusCount,
                      sexes: pregnancy.fetalSexes ?? "—",
                    })
                  : "—"
              }
            />
            <HeroFact
              label={t("home.dueDate")}
              value={formatDate(pregnancy.dueDate, locale)}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

function GenericHero({ journey }: { journey: PortalJourney | null }) {
  const t = useTranslations("patientPortal");
  const current = journey?.stages.find((s) => s.status === "current");

  return (
    <div className={HERO_SHELL}>
      <div className="flex items-center gap-4">
        <span className="flex size-12 items-center justify-center rounded-2xl bg-white/15">
          <Activity className="size-6" />
        </span>
        <div className="min-w-0">
          <h2 className="truncate text-xl font-bold">
            {journey?.label ?? t("home.journeyHeroFallback")}
          </h2>
          <p className="mt-0.5 text-sm text-white/70">
            {current?.name ?? t("home.journeyEmpty")}
          </p>
        </div>
      </div>
    </div>
  );
}

function HeroSkeleton() {
  return (
    <div className={HERO_SHELL}>
      <div className="flex items-center gap-6">
        <div className="size-[116px] shrink-0 animate-pulse rounded-full bg-white/15" />
        <div className="flex-1 space-y-3">
          <div className="h-6 w-28 animate-pulse rounded-full bg-white/15" />
          <div className="h-7 w-40 animate-pulse rounded bg-white/15" />
          <div className="h-10 w-full animate-pulse rounded bg-white/10" />
        </div>
      </div>
    </div>
  );
}

/**
 * Home hero. Generic across care paths, switching on the journey's care-path
 * type: a pregnancy journey renders the gestational-progress card (ring, type
 * badge, week, fetuses, due date); any other journey (or none) renders a
 * compact generic summary so the home stays valid for non-pregnancy patients.
 */
export function JourneyHero({
  journey,
  isLoading,
}: {
  journey: PortalJourney | null | undefined;
  isLoading: boolean;
}) {
  if (isLoading) return <HeroSkeleton />;
  if (journey?.pregnancy) return <PregnancyHero pregnancy={journey.pregnancy} />;
  return <GenericHero journey={journey ?? null} />;
}
