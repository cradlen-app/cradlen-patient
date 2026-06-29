import { describe, expect, it, vi, beforeEach } from "vitest";
import type { ReactNode } from "react";
import { renderWithProviders, screen } from "@/test/render";

type Summary = {
  medicines: number;
  tests: number;
  nextVisit: number;
  needAttention: number;
  isLoading: boolean;
};

const mocks = vi.hoisted(() => ({ summary: undefined as unknown as Summary }));

vi.mock("@/i18n/navigation", () => ({
  Link: ({ children, href }: { children: ReactNode; href: string }) => (
    <a href={typeof href === "string" ? href : "#"}>{children}</a>
  ),
}));

vi.mock("../../hooks/usePortalData", () => ({
  useHomeSummary: () => mocks.summary,
}));

import { TodayCard } from "./TodayCard";

beforeEach(() => {
  mocks.summary = {
    medicines: 0,
    tests: 0,
    nextVisit: 0,
    needAttention: 0,
    isLoading: false,
  };
});

describe("TodayCard", () => {
  it("renders skeletons and suppresses the tally while loading", () => {
    mocks.summary = { ...mocks.summary, isLoading: true };
    const { container } = renderWithProviders(<TodayCard />);
    expect(container.querySelectorAll(".animate-pulse").length).toBeGreaterThan(0);
    expect(screen.queryByText("You're all caught up")).not.toBeInTheDocument();
  });

  it("renders the three action rows with their counts", () => {
    mocks.summary = {
      medicines: 2,
      tests: 1,
      nextVisit: 0,
      needAttention: 2,
      isLoading: false,
    };
    renderWithProviders(<TodayCard />);
    expect(screen.getByText("Medicines")).toBeInTheDocument();
    expect(screen.getByText("Tests")).toBeInTheDocument();
    expect(screen.getByText("Next visit")).toBeInTheDocument();
    expect(screen.getByText("2 need attention")).toBeInTheDocument();
  });

  it("shows the all-clear tally when nothing needs attention", () => {
    renderWithProviders(<TodayCard />);
    expect(screen.getByText("You're all caught up")).toBeInTheDocument();
  });

  it("links each row to its screen", () => {
    renderWithProviders(<TodayCard />);
    expect(screen.getByRole("link", { name: /Medicines/ })).toHaveAttribute(
      "href",
      "/patient/medications",
    );
    expect(screen.getByRole("link", { name: /Tests/ })).toHaveAttribute(
      "href",
      "/patient/tests",
    );
  });
});
