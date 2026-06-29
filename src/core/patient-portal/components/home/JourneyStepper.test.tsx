import { describe, expect, it, vi } from "vitest";
import type { ReactNode } from "react";
import { renderWithProviders, screen } from "@/test/render";
import type { PortalJourney } from "../../types/patient-portal.types";

// HomeCard (in the import graph) pulls in @/i18n/navigation, whose createNavigation
// trips a next/navigation ESM-resolution quirk under vitest; stub it.
vi.mock("@/i18n/navigation", () => ({
  Link: ({ children, href }: { children: ReactNode; href: string }) => (
    <a href={typeof href === "string" ? href : "#"}>{children}</a>
  ),
  useRouter: () => ({ push: () => {}, replace: () => {} }),
  usePathname: () => "/",
  redirect: () => {},
}));

import { JourneyStepper } from "./JourneyStepper";

function journey(overrides: Partial<PortalJourney> = {}): PortalJourney {
  return {
    id: "j1",
    status: "ACTIVE",
    startedAt: "2026-01-01T00:00:00.000Z",
    stages: [
      { id: "s1", name: "First trimester", order: 1, status: "done" },
      { id: "s2", name: "Second trimester", order: 2, status: "current" },
      { id: "s3", name: "Third trimester", order: 3, status: "upcoming" },
    ],
    ...overrides,
  } as PortalJourney;
}

describe("JourneyStepper", () => {
  it("renders nothing when there are no stages", () => {
    const { container } = renderWithProviders(
      <JourneyStepper journey={journey({ stages: [] })} />,
    );
    expect(container).toBeEmptyDOMElement();
  });

  it("renders a node per stage with its name", () => {
    renderWithProviders(<JourneyStepper journey={journey()} />);
    expect(screen.getByText("First trimester")).toBeInTheDocument();
    expect(screen.getByText("Second trimester")).toBeInTheDocument();
    expect(screen.getByText("Third trimester")).toBeInTheDocument();
  });

  it("labels each stage with its localized status", () => {
    renderWithProviders(<JourneyStepper journey={journey()} />);
    expect(screen.getByText("Done")).toBeInTheDocument();
    expect(screen.getByText("Current")).toBeInTheDocument();
    expect(screen.getByText("Upcoming")).toBeInTheDocument();
  });
});
