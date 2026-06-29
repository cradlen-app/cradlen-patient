import { describe, expect, it, vi, beforeEach } from "vitest";
import { renderWithProviders, screen } from "@/test/render";
import type { PortalTest } from "../types/patient-portal.types";

type InvState = {
  entries: PortalTest[];
  isLoading: boolean;
  isLoadingMore: boolean;
  hasMore: boolean;
  loadMore: () => void;
};

const EMPTY: InvState = {
  entries: [],
  isLoading: false,
  isLoadingMore: false,
  hasMore: false,
  loadMore: () => {},
};

const mocks = vi.hoisted(() => ({ inv: undefined as unknown as InvState }));

vi.mock("../hooks/usePortalData", () => ({
  useInvestigations: () => mocks.inv,
}));

// Upload hooks are only used inside an expanded card; stub them as idle.
vi.mock("../hooks/useUploadInvestigationResult", () => ({
  useUploadInvestigationResult: () => ({ mutateAsync: vi.fn(), isPending: false }),
  useRemoveInvestigationAttachment: () => ({ mutateAsync: vi.fn(), isPending: false }),
}));

import { TestsScreen } from "./TestsScreen";

function test_(overrides: Partial<PortalTest> = {}): PortalTest {
  return {
    id: "t1",
    name: "Complete Blood Count",
    date: "2026-06-01T00:00:00.000Z",
    doctorName: "Dr. Jane Doe",
    category: "lab",
    status: "pending",
    clinic: { id: "c1", name: "Maadi Branch" },
    results: [],
    ...overrides,
  } as PortalTest;
}

beforeEach(() => {
  mocks.inv = { ...EMPTY };
});

describe("TestsScreen", () => {
  it("renders the header and both filter pills with the default 'All' value", () => {
    renderWithProviders(<TestsScreen />);
    expect(screen.getByText("Tests")).toBeInTheDocument();
    expect(screen.getByText("Status:")).toBeInTheDocument();
    expect(screen.getByText("Type:")).toBeInTheDocument();
    // The filter pills default to "All" (one per pill).
    expect(screen.getAllByText("All").length).toBeGreaterThanOrEqual(2);
  });

  it("shows a loading state while investigations load", () => {
    mocks.inv = { ...EMPTY, isLoading: true };
    renderWithProviders(<TestsScreen />);
    expect(screen.getByText("Loading…")).toBeInTheDocument();
  });

  it("shows the empty state when there are no tests", () => {
    renderWithProviders(<TestsScreen />);
    expect(screen.getByText("No tests ordered")).toBeInTheDocument();
  });

  it("renders a test card (collapsed) with its name and status", () => {
    mocks.inv = { ...EMPTY, entries: [test_()] };
    renderWithProviders(<TestsScreen />);
    expect(screen.getByText("Complete Blood Count")).toBeInTheDocument();
    expect(screen.getByText("Pending")).toBeInTheDocument();
    // Collapsed card with no uploaded files.
    expect(screen.getByText("No Uploaded Files")).toBeInTheDocument();
  });
});
