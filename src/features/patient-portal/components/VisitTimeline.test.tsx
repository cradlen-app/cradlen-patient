import { describe, expect, it, vi } from "vitest";
import userEvent from "@testing-library/user-event";
import { renderWithProviders, screen } from "@/test/render";
import { VisitTimeline } from "./VisitTimeline";
import type { PortalVisit } from "../types/patient-portal.types";

function visit(overrides: Partial<PortalVisit> = {}): PortalVisit {
  return {
    id: "v1",
    date: "2026-06-14T00:00:00.000Z",
    clinic: { id: "c1", name: "Maadi Branch" },
    doctorName: "Dr. Jane Doe",
    specialty: "OBGYN",
    status: "completed",
    type: "VISIT",
    priority: "normal",
    diagnosis: "Iron-deficiency anemia",
    medications: ["Folic Acid 5mg Daily"],
    investigations: ["CBC"],
    organizationName: "Cradlen Clinic",
    ...overrides,
  } as PortalVisit;
}

const baseProps = {
  entries: [] as PortalVisit[],
  isLoading: false,
  hasMore: false,
  isLoadingMore: false,
  loadMore: () => {},
};

describe("VisitTimeline", () => {
  it("renders skeleton placeholders while loading (no empty state, no data)", () => {
    const { container } = renderWithProviders(
      <VisitTimeline {...baseProps} isLoading />,
    );
    expect(screen.queryByText("No visits recorded yet")).not.toBeInTheDocument();
    expect(container.querySelectorAll(".animate-pulse").length).toBeGreaterThan(0);
  });

  it("renders the empty state when there are no visits", () => {
    renderWithProviders(<VisitTimeline {...baseProps} entries={[]} />);
    expect(screen.getByText("No visits recorded yet")).toBeInTheDocument();
  });

  it("renders a card per entry with diagnosis, medication, and doctor", () => {
    renderWithProviders(
      <VisitTimeline {...baseProps} entries={[visit()]} />,
    );
    expect(screen.getByText("Iron-deficiency anemia")).toBeInTheDocument();
    expect(screen.getByText("Folic Acid 5mg Daily")).toBeInTheDocument();
    expect(screen.getByText(/Dr\. Jane Doe/)).toBeInTheDocument();
    expect(screen.getByText("Visit")).toBeInTheDocument();
  });

  it("falls back to the generic 'Visit' label for an unknown visit type", () => {
    renderWithProviders(
      <VisitTimeline
        {...baseProps}
        entries={[visit({ type: "MYSTERY_TYPE" as PortalVisit["type"] })]}
      />,
    );
    // The raw i18n key must never leak into the UI.
    expect(screen.queryByText(/record\.typeLabel/)).not.toBeInTheDocument();
    expect(screen.getByText("Visit")).toBeInTheDocument();
  });

  it("shows a 'Normal' pill for normal priority and 'Abnormal' for emergency", () => {
    const { rerender } = renderWithProviders(
      <VisitTimeline {...baseProps} entries={[visit({ priority: "normal" })]} />,
    );
    expect(screen.getByText("Normal")).toBeInTheDocument();

    rerender(
      <VisitTimeline {...baseProps} entries={[visit({ priority: "emergency" })]} />,
    );
    expect(screen.getByText("Abnormal")).toBeInTheDocument();
  });

  it("renders a Load More button when hasMore and calls loadMore on click", async () => {
    const loadMore = vi.fn();
    renderWithProviders(
      <VisitTimeline {...baseProps} entries={[visit()]} hasMore loadMore={loadMore} />,
    );
    const button = screen.getByRole("button", { name: "Load more" });
    await userEvent.click(button);
    expect(loadMore).toHaveBeenCalledTimes(1);
  });

  it("disables the Load More button and shows a loading label while fetching more", () => {
    renderWithProviders(
      <VisitTimeline {...baseProps} entries={[visit()]} hasMore isLoadingMore />,
    );
    const button = screen.getByRole("button", { name: "Loading…" });
    expect(button).toBeDisabled();
  });

  it("hides the Load More button when there is nothing more to load", () => {
    renderWithProviders(
      <VisitTimeline {...baseProps} entries={[visit()]} hasMore={false} />,
    );
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });
});
