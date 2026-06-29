import { describe, expect, it, vi, beforeEach } from "vitest";
import type { ReactNode } from "react";
import { renderWithProviders, screen } from "@/test/render";
import type {
  PortalMedication,
  PortalTest,
  PortalUpcomingVisit,
} from "../../types/patient-portal.types";

const mocks = vi.hoisted(() => ({
  upcoming: { entries: [] as PortalUpcomingVisit[], isLoading: false },
  tests: { entries: [] as PortalTest[], isLoading: false },
  meds: { data: [] as PortalMedication[], isLoading: false },
}));

vi.mock("@/i18n/navigation", () => ({
  Link: ({ children, href }: { children: ReactNode; href: string }) => (
    <a href={typeof href === "string" ? href : "#"}>{children}</a>
  ),
}));

vi.mock("../../hooks/usePortalData", () => ({
  useUpcomingVisits: () => mocks.upcoming,
  useInvestigations: () => mocks.tests,
  useMedications: () => mocks.meds,
}));

import { BottomCards } from "./BottomCards";

function upcoming(): PortalUpcomingVisit {
  return {
    id: "u1",
    date: "2026-07-15T09:00:00.000Z",
    clinic: { id: "c1", name: "Maadi" },
    doctorName: "Dr. Jane Doe",
    specialty: "OBGYN",
    note: undefined,
  } as PortalUpcomingVisit;
}

function test_(): PortalTest {
  return {
    id: "t1",
    name: "Complete Blood Count",
    date: "2026-06-01T00:00:00.000Z",
    doctorName: "Dr. Jane Doe",
    category: "lab",
    status: "reviewed",
    clinic: { id: "c1", name: "Maadi" },
    results: [],
  } as PortalTest;
}

function med(): PortalMedication {
  return {
    id: "m1",
    prescriptionId: "rx1",
    name: "Folic Acid",
    dose: "5mg",
    frequency: "Once daily",
    prescriberName: "Dr. Jane",
    clinic: { id: "c1", name: "Maadi" },
    startDate: "2026-06-01T00:00:00.000Z",
    status: "active",
    form: "tablet",
  } as PortalMedication;
}

beforeEach(() => {
  mocks.upcoming = { entries: [], isLoading: false };
  mocks.tests = { entries: [], isLoading: false };
  mocks.meds = { data: [], isLoading: false };
});

describe("BottomCards", () => {
  it("renders the three card titles", () => {
    renderWithProviders(<BottomCards />);
    expect(screen.getByText("Upcoming visit")).toBeInTheDocument();
    expect(screen.getByText("Recent test")).toBeInTheDocument();
    expect(screen.getByText("My medications")).toBeInTheDocument();
  });

  it("shows each card's empty state when there is no data", () => {
    renderWithProviders(<BottomCards />);
    expect(screen.getByText("No upcoming appointments")).toBeInTheDocument();
    expect(screen.getByText("No recent tests")).toBeInTheDocument();
    expect(screen.getByText("No prescriptions on record")).toBeInTheDocument();
  });

  it("renders content from all three data hooks", () => {
    mocks.upcoming = { entries: [upcoming()], isLoading: false };
    mocks.tests = { entries: [test_()], isLoading: false };
    mocks.meds = { data: [med()], isLoading: false };
    renderWithProviders(<BottomCards />);

    expect(screen.getByText("Complete Blood Count")).toBeInTheDocument();
    expect(screen.getByText("Folic Acid")).toBeInTheDocument();
    // The upcoming-visit card shows the doctor name.
    expect(screen.getAllByText("Dr. Jane Doe").length).toBeGreaterThan(0);
  });

  it("only counts active medications", () => {
    mocks.meds = {
      data: [med(), { ...med(), id: "m2", name: "Old Med", status: "past" }],
      isLoading: false,
    };
    renderWithProviders(<BottomCards />);
    expect(screen.getByText("Folic Acid")).toBeInTheDocument();
    expect(screen.queryByText("Old Med")).not.toBeInTheDocument();
  });
});
