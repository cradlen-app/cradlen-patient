import { describe, expect, it, vi, beforeEach } from "vitest";
import { renderWithProviders, screen } from "@/test/render";
import type {
  PortalJourneyTimelineEntry,
  PortalVisit,
} from "../types/patient-portal.types";

type State = {
  entries: PortalJourneyTimelineEntry[];
  isLoading: boolean;
  hasMore: boolean;
  isLoadingMore: boolean;
  loadMore: () => void;
};

const EMPTY: State = {
  entries: [],
  isLoading: false,
  hasMore: false,
  isLoadingMore: false,
  loadMore: () => {},
};

const mocks = vi.hoisted(() => ({ state: undefined as unknown as State }));

vi.mock("../hooks/usePortalData", () => ({
  usePatientJourneyTimeline: () => mocks.state,
}));

import { JourneyTimeline } from "./JourneyTimeline";

function visit(): PortalVisit {
  return {
    id: "v1",
    date: "2026-06-02T00:00:00.000Z",
    clinic: { id: "c1", name: "Maadi" },
    doctorName: "Dr. Jane",
    specialty: "OBGYN",
    status: "completed",
    type: "VISIT",
    priority: "normal",
    diagnosis: "Routine checkup",
    medications: [],
    investigations: [],
  } as PortalVisit;
}

function journey(
  overrides: Partial<PortalJourneyTimelineEntry> = {},
): PortalJourneyTimelineEntry {
  return {
    id: "j1",
    name: "Pregnancy",
    type: "OBGYN_PREGNANCY",
    status: "ACTIVE",
    startedAt: "2026-01-01T00:00:00.000Z",
    endedAt: null,
    episodes: [
      {
        id: "e1",
        name: "First trimester",
        order: 1,
        status: "ACTIVE",
        startedAt: "2026-01-01T00:00:00.000Z",
        endedAt: null,
        visits: [visit()],
      },
    ],
    ...overrides,
  };
}

beforeEach(() => {
  mocks.state = { ...EMPTY };
});

describe("JourneyTimeline", () => {
  it("renders a loading skeleton", () => {
    mocks.state = { ...EMPTY, isLoading: true };
    const { container } = renderWithProviders(<JourneyTimeline />);
    expect(container.querySelectorAll(".animate-pulse").length).toBeGreaterThan(0);
    expect(
      screen.queryByText("No care journeys recorded yet"),
    ).not.toBeInTheDocument();
  });

  it("renders the empty state when there are no journeys", () => {
    renderWithProviders(<JourneyTimeline />);
    expect(
      screen.getByText("No care journeys recorded yet"),
    ).toBeInTheDocument();
  });

  it("renders the journey header with its name and status", () => {
    mocks.state = { ...EMPTY, entries: [journey()] };
    renderWithProviders(<JourneyTimeline />);
    expect(screen.getByText("Pregnancy")).toBeInTheDocument();
    expect(screen.getByText("Active")).toBeInTheDocument();
  });

  it("renders a Load More control when more journeys exist", () => {
    mocks.state = { ...EMPTY, entries: [journey()], hasMore: true };
    renderWithProviders(<JourneyTimeline />);
    expect(screen.getByRole("button", { name: "Load more" })).toBeInTheDocument();
  });
});
