import { describe, expect, it } from "vitest";
import { renderWithProviders, screen } from "@/test/render";
import { JourneyHero } from "./JourneyHero";
import type {
  PortalJourney,
  PortalPregnancy,
} from "../../types/patient-portal.types";

function pregnancy(overrides: Partial<PortalPregnancy> = {}): PortalPregnancy {
  return {
    weeks: 24,
    days: 3,
    dueDate: "2026-10-01T00:00:00.000Z",
    fetusCount: 1,
    pregnancyType: "singleton",
    fetalSexes: "Girl",
    riskLevel: "low",
    ...overrides,
  };
}

function journey(overrides: Partial<PortalJourney> = {}): PortalJourney {
  return {
    id: "j1",
    status: "ACTIVE",
    startedAt: "2026-01-01T00:00:00.000Z",
    label: "Pregnancy",
    stages: [{ id: "s1", name: "Second trimester", order: 2, status: "current" }],
    ...overrides,
  } as PortalJourney;
}

describe("JourneyHero", () => {
  it("renders a skeleton while loading", () => {
    const { container } = renderWithProviders(
      <JourneyHero journey={undefined} isLoading />,
    );
    expect(container.querySelectorAll(".animate-pulse").length).toBeGreaterThan(0);
    expect(screen.queryByText(/Week/)).not.toBeInTheDocument();
  });

  it("renders the pregnancy hero with gestational progress and due date", () => {
    renderWithProviders(
      <JourneyHero journey={journey({ pregnancy: pregnancy() })} isLoading={false} />,
    );
    expect(screen.getByRole("img", { name: "24 / 40 wks" })).toBeInTheDocument();
    expect(screen.getByText("Week 24 of 40")).toBeInTheDocument();
    expect(screen.getByText("Pregnancy")).toBeInTheDocument();
    expect(screen.getByText("Due date")).toBeInTheDocument();
    expect(screen.getByText(/2026/)).toBeInTheDocument();
  });

  it("labels twin pregnancies and shows a high-risk badge", () => {
    renderWithProviders(
      <JourneyHero
        journey={journey({
          pregnancy: pregnancy({ pregnancyType: "twin", riskLevel: "high" }),
        })}
        isLoading={false}
      />,
    );
    expect(screen.getByText("Twin pregnancy")).toBeInTheDocument();
    expect(screen.getByText("High risk")).toBeInTheDocument();
  });

  it("renders a generic hero for a non-pregnancy journey", () => {
    renderWithProviders(
      <JourneyHero journey={journey({ label: "Diabetes care" })} isLoading={false} />,
    );
    expect(screen.getByText("Diabetes care")).toBeInTheDocument();
    expect(screen.getByText("Second trimester")).toBeInTheDocument();
  });

  it("falls back gracefully when there is no journey", () => {
    renderWithProviders(<JourneyHero journey={null} isLoading={false} />);
    expect(screen.getByText("Your active care journey")).toBeInTheDocument();
    expect(screen.getByText("No active journey yet")).toBeInTheDocument();
  });
});
