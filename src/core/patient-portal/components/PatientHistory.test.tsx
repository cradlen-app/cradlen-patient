import { describe, expect, it, vi, beforeEach } from "vitest";
import { renderWithProviders, screen } from "@/test/render";
import type { ApiPortalHistoryGroup } from "../data/patient-history.api.types";

type State = { data: ApiPortalHistoryGroup[] | undefined; isLoading: boolean };

const mocks = vi.hoisted(() => ({ state: undefined as unknown as State }));

vi.mock("../hooks/usePortalData", () => ({
  usePatientHistory: () => mocks.state,
}));

import { PatientHistory } from "./PatientHistory";

const GROUP: ApiPortalHistoryGroup = {
  code: "OBGYN",
  label: "OB/GYN history",
  version: 1,
  sections: [
    {
      code: "PREGNANCIES",
      label: "Pregnancies",
      entries: [
        {
          title: "Pregnancy 1",
          rows: [
            { label: "Outcome", value: "Live birth" },
            { label: "Year", value: "2024" },
          ],
        },
      ],
    },
  ],
};

beforeEach(() => {
  mocks.state = { data: [], isLoading: false };
});

describe("PatientHistory", () => {
  it("renders skeleton panels while loading", () => {
    mocks.state = { data: undefined, isLoading: true };
    const { container } = renderWithProviders(<PatientHistory />);
    expect(container.querySelectorAll(".animate-pulse").length).toBeGreaterThan(0);
    expect(screen.queryByText("No history recorded yet")).not.toBeInTheDocument();
  });

  it("renders the empty state when there is no history", () => {
    renderWithProviders(<PatientHistory />);
    expect(screen.getByText("No history recorded yet")).toBeInTheDocument();
  });

  it("renders groups, sections, entries, and rows", () => {
    mocks.state = { data: [GROUP], isLoading: false };
    renderWithProviders(<PatientHistory />);
    expect(screen.getByText("OB/GYN history")).toBeInTheDocument();
    expect(screen.getByText("Pregnancies")).toBeInTheDocument();
    expect(screen.getByText("Pregnancy 1")).toBeInTheDocument();
    expect(screen.getByText("Outcome")).toBeInTheDocument();
    expect(screen.getByText("Live birth")).toBeInTheDocument();
  });

  it("gives each collapsible an accessible expand label", () => {
    mocks.state = { data: [GROUP], isLoading: false };
    renderWithProviders(<PatientHistory />);
    expect(
      screen.getByLabelText("Expand section: OB/GYN history"),
    ).toBeInTheDocument();
  });
});
