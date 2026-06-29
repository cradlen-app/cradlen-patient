import { describe, expect, it, vi } from "vitest";
import { renderWithProviders, screen } from "@/test/render";

// RecordScreen is a thin shell over PatientHistory (which has its own data hooks);
// stub it so this test stays focused on the screen header + composition.
vi.mock("./PatientHistory", () => ({
  PatientHistory: () => <div data-testid="patient-history" />,
}));

import { RecordScreen } from "./RecordScreen";

describe("RecordScreen", () => {
  it("renders the health-record header and the history section", () => {
    renderWithProviders(<RecordScreen />);
    expect(
      screen.getByRole("heading", { level: 1, name: "Health record" }),
    ).toBeInTheDocument();
    expect(screen.getByTestId("patient-history")).toBeInTheDocument();
  });
});
