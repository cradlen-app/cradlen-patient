/**
 * Boundary mapping from the backend journey-timeline wire shape
 * (`ApiPatientJourneyTimelineEntry`) to the portal's `PortalJourneyTimelineEntry`
 * view model. Each nested visit reuses {@link mapApiVisit}, so the timeline cards
 * render identically to the flat visit history.
 *
 * Pure (no React/i18n).
 */
import type {
  PortalJourneyTimelineEntry,
  PortalJourneyTimelineEpisode,
} from "../types/patient-portal.types";
import type {
  ApiPatientJourneyTimelineEntry,
  ApiPatientJourneyTimelineEpisode,
} from "../data/patient-journey-timeline.api.types";
import { mapApiVisit } from "./map-visit";

function mapEpisode(
  episode: ApiPatientJourneyTimelineEpisode,
): PortalJourneyTimelineEpisode {
  return {
    id: episode.id,
    name: episode.name,
    order: episode.order,
    status: episode.status,
    startedAt: episode.started_at,
    endedAt: episode.ended_at,
    visits: episode.visits.map(mapApiVisit),
  };
}

export function mapApiJourneyTimeline(
  entry: ApiPatientJourneyTimelineEntry,
): PortalJourneyTimelineEntry {
  return {
    id: entry.id,
    name: entry.name,
    type: entry.type,
    status: entry.status,
    startedAt: entry.started_at,
    endedAt: entry.ended_at,
    episodes: entry.episodes.map(mapEpisode),
  };
}
