import { describe, expect, it, vi, beforeEach } from "vitest";
import { renderWithProviders, screen } from "@/test/render";
import type { PortalUpcomingVisit } from "../types/patient-portal.types";

type TimelineState = {
  entries: PortalUpcomingVisit[];
  isLoading: boolean;
  hasMore: boolean;
  isLoadingMore: boolean;
  loadMore: () => void;
};

const EMPTY: TimelineState = {
  entries: [],
  isLoading: false,
  hasMore: false,
  isLoadingMore: false,
  loadMore: () => {},
};

const mocks = vi.hoisted(() => ({
  upcoming: undefined as unknown as TimelineState,
  journey: undefined as unknown as TimelineState,
}));

vi.mock("../hooks/usePortalData", () => ({
  useUpcomingVisits: () => mocks.upcoming,
  usePatientJourneyTimeline: () => mocks.journey,
}));

import { VisitsScreen } from "./VisitsScreen";

function upcoming(overrides: Partial<PortalUpcomingVisit> = {}): PortalUpcomingVisit {
  return {
    id: "u1",
    date: "2026-07-15T09:00:00.000Z",
    clinic: { id: "c1", name: "Maadi Branch" },
    doctorName: "Dr. Jane Doe",
    specialty: "OBGYN",
    organizationName: "Cradlen Clinic",
    note: "Bring previous labs",
    ...overrides,
  } as PortalUpcomingVisit;
}

beforeEach(() => {
  mocks.upcoming = { ...EMPTY };
  mocks.journey = { ...EMPTY };
});

describe("VisitsScreen — upcoming visits section", () => {
  it("renders the screen header and section titles", () => {
    renderWithProviders(<VisitsScreen />);
    expect(screen.getByText("Visits")).toBeInTheDocument();
    expect(screen.getByText("Upcoming visits")).toBeInTheDocument();
    expect(screen.getByText("Last visits")).toBeInTheDocument();
  });

  it("shows skeletons while upcoming visits load", () => {
    mocks.upcoming = { ...EMPTY, isLoading: true };
    const { container } = renderWithProviders(<VisitsScreen />);
    expect(screen.queryByText("No upcoming visits")).not.toBeInTheDocument();
    expect(container.querySelectorAll(".animate-pulse").length).toBeGreaterThan(0);
  });

  it("shows the empty state when there are no upcoming visits", () => {
    renderWithProviders(<VisitsScreen />);
    expect(screen.getByText("No upcoming visits")).toBeInTheDocument();
  });

  it("renders an upcoming follow-up card with doctor and note", () => {
    mocks.upcoming = { ...EMPTY, entries: [upcoming()] };
    renderWithProviders(<VisitsScreen />);
    expect(screen.getByText("Follow-up")).toBeInTheDocument();
    expect(screen.getByText(/Dr\. Jane Doe/)).toBeInTheDocument();
    expect(screen.getByText("Bring previous labs")).toBeInTheDocument();
  });

  it("renders a Load More control when more upcoming visits exist", () => {
    mocks.upcoming = { ...EMPTY, entries: [upcoming()], hasMore: true };
    renderWithProviders(<VisitsScreen />);
    expect(screen.getByRole("button", { name: "Load more" })).toBeInTheDocument();
  });
});
