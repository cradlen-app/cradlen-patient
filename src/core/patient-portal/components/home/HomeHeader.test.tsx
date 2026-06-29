import { describe, expect, it, vi } from "vitest";
import { renderWithProviders, screen } from "@/test/render";

const mocks = vi.hoisted(() => ({
  profile: undefined as { fullName: string } | undefined,
}));

vi.mock("../../hooks/usePatientProfiles", () => ({
  useActiveProfile: () => mocks.profile,
}));

import { HomeHeader } from "./HomeHeader";

describe("HomeHeader", () => {
  it("greets the active patient by name", () => {
    mocks.profile = { fullName: "Layla Hassan" };
    renderWithProviders(<HomeHeader />);
    expect(screen.getByText("Hello,")).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { level: 1, name: "Layla Hassan" }),
    ).toBeInTheDocument();
    expect(
      screen.getByText("Here's where your care stands today."),
    ).toBeInTheDocument();
  });

  it("renders an empty name without crashing when there is no profile", () => {
    mocks.profile = undefined;
    renderWithProviders(<HomeHeader />);
    expect(screen.getByText("Hello,")).toBeInTheDocument();
  });
});
