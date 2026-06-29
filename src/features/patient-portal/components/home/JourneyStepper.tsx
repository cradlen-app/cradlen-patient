"use client";

import { Check } from "lucide-react";
import { useTranslations } from "next-intl";

import { cn } from "@/common/utils/utils";
import type {
  JourneyStageStatus,
  PortalJourney,
} from "../../types/patient-portal.types";
import { StatusBadge } from "../portal-ui";
import { HomeCard, HomeCardHeader } from "./HomeCard";

const BADGE_TONE: Record<JourneyStageStatus, "green" | "brand" | "gray"> = {
  done: "green",
  current: "brand",
  upcoming: "gray",
};

function StageNode({ status }: { status: JourneyStageStatus }) {
  if (status === "done") {
    return (
      <span className="z-10 flex size-6 items-center justify-center rounded-full bg-brand-primary text-white">
        <Check className="size-3.5" strokeWidth={3} />
      </span>
    );
  }
  if (status === "current") {
    return (
      <span className="z-10 flex size-6 items-center justify-center rounded-full border-[3px] border-brand-primary bg-white shadow-[0_0_0_4px_rgba(17,96,76,0.12)]">
        <span className="size-2 rounded-full bg-brand-primary" />
      </span>
    );
  }
  return (
    <span className="z-10 flex size-6 items-center justify-center rounded-full border-2 border-gray-300 bg-white" />
  );
}

function Stage({
  stage,
  isFirst,
  isLast,
  leftFilled,
  rightFilled,
  statusLabel,
}: {
  stage: PortalJourney["stages"][number];
  isFirst: boolean;
  isLast: boolean;
  leftFilled: boolean;
  rightFilled: boolean;
  statusLabel: string;
}) {
  return (
    <li className="flex min-w-[7.5rem] flex-1 flex-col items-center text-center">
      <div className="flex w-full items-center justify-center">
        <span
          className={cn(
            "h-0.5 flex-1",
            isFirst ? "opacity-0" : leftFilled ? "bg-brand-primary" : "bg-gray-200",
          )}
        />
        <StageNode status={stage.status} />
        <span
          className={cn(
            "h-0.5 flex-1",
            isLast ? "opacity-0" : rightFilled ? "bg-brand-primary" : "bg-gray-200",
          )}
        />
      </div>
      <p
        className={cn(
          "mt-2 px-1 text-xs font-semibold",
          stage.status === "upcoming" ? "text-gray-400" : "text-brand-black",
        )}
      >
        {stage.name}
      </p>
      <span className="mt-1.5">
        <StatusBadge label={statusLabel} tone={BADGE_TONE[stage.status]} />
      </span>
    </li>
  );
}

/**
 * Horizontal journey stepper driven by `journey.stages`. Generic across care
 * paths — a connector segment is filled once its preceding stage is done, so
 * the green path runs up to (and into) the current stage. Scrolls horizontally
 * on narrow screens. Renders nothing when there are no stages.
 */
export function JourneyStepper({ journey }: { journey: PortalJourney }) {
  const t = useTranslations("patientPortal");
  const stages = journey.stages;
  if (stages.length === 0) return null;

  const isPregnancy = Boolean(journey.pregnancy);
  const statusLabel: Record<JourneyStageStatus, string> = {
    done: t("home.statusDone"),
    current: t("home.statusCurrent"),
    upcoming: t("home.statusUpcoming"),
  };

  return (
    <HomeCard>
      <HomeCardHeader
        title={t("home.journeyTitle", { pregnancy: String(isPregnancy) })}
      />
      <p className="-mt-2 mb-4 text-[11px] font-semibold uppercase tracking-wide text-brand-secondary">
        {t("home.journeyLegend")}
      </p>
      <ol className="flex items-start overflow-x-auto pb-1">
        {stages.map((stage, i) => (
          <Stage
            key={stage.id}
            stage={stage}
            isFirst={i === 0}
            isLast={i === stages.length - 1}
            leftFilled={i > 0 && stages[i - 1].status === "done"}
            rightFilled={stage.status === "done"}
            statusLabel={statusLabel[stage.status]}
          />
        ))}
      </ol>
    </HomeCard>
  );
}
