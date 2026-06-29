import { describe, expect, it, vi, beforeEach } from "vitest";
import { renderWithProviders, screen } from "@/test/render";
import type { PortalMedication } from "../types/patient-portal.types";

type MedState = { data: PortalMedication[] | undefined; isLoading: boolean };

const mocks = vi.hoisted(() => ({ state: undefined as unknown as MedState }));

vi.mock("../hooks/usePortalData", () => ({
  useMedications: () => mocks.state,
}));

import { MedicationsScreen } from "./MedicationsScreen";

function med(overrides: Partial<PortalMedication> = {}): PortalMedication {
  return {
    id: "m1",
    prescriptionId: "rx1",
    name: "Folic Acid",
    dose: "5mg",
    frequency: "Once daily",
    prescriberName: "Dr. Jane Doe",
    clinic: { id: "c1", name: "Maadi Branch" },
    startDate: "2026-06-01T00:00:00.000Z",
    status: "active",
    form: "tablet",
    ...overrides,
  } as PortalMedication;
}

beforeEach(() => {
  mocks.state = { data: [], isLoading: false };
});

describe("MedicationsScreen", () => {
  it("renders the screen header", () => {
    renderWithProviders(<MedicationsScreen />);
    expect(
      screen.getByRole("heading", { level: 1, name: "Prescriptions" }),
    ).toBeInTheDocument();
  });

  it("shows a loading state while medications load", () => {
    mocks.state = { data: undefined, isLoading: true };
    renderWithProviders(<MedicationsScreen />);
    expect(screen.getByText("Loading…")).toBeInTheDocument();
  });

  it("shows the empty state when there are no prescriptions", () => {
    renderWithProviders(<MedicationsScreen />);
    expect(screen.getByText("No prescriptions on record")).toBeInTheDocument();
  });

  it("groups medicines into a prescription card with doctor and medicine", () => {
    mocks.state = {
      data: [med(), med({ id: "m2", name: "Iron" })],
      isLoading: false,
    };
    renderWithProviders(<MedicationsScreen />);
    expect(screen.getByText("Folic Acid")).toBeInTheDocument();
    expect(screen.getByText("Iron")).toBeInTheDocument();
    expect(screen.getByText(/Dr\. Jane Doe/)).toBeInTheDocument();
    expect(screen.getAllByText("Once daily").length).toBeGreaterThan(0);
  });
});
