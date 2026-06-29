"use client";

import { usePatientJourney } from "../hooks/usePortalData";
import { BottomCards } from "./home/BottomCards";
import { HomeHeader } from "./home/HomeHeader";
import { JourneyHero } from "./home/JourneyHero";
import { JourneyStepper } from "./home/JourneyStepper";
import { TodayCard } from "./home/TodayCard";

/**
 * Patient Home — a care dashboard. Greeting + profile switcher, then a journey
 * hero (pregnancy variant: gestational ring; generic otherwise) beside the
 * "Don't forget today" card, the full-width journey stepper, and a bottom row
 * of upcoming visit / recent test / medications.
 *
 * The hero + stepper switch on the active journey's care-path type, so the home
 * stays valid for non-pregnancy patients; the stepper only renders when the
 * journey has stages.
 */
export function HomeScreen() {
  const { data: journey, isLoading } = usePatientJourney();

  return (
    <div className="w-full space-y-5 pb-24 lg:pb-0">
      <HomeHeader />

      <div className="grid gap-4 lg:grid-cols-[1.4fr_1fr]">
        <JourneyHero journey={journey} isLoading={isLoading} />
        <TodayCard />
      </div>

      {journey && journey.stages.length > 0 && (
        <JourneyStepper journey={journey} />
      )}

      <BottomCards />
    </div>
  );
}
