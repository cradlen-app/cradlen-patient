import { beforeEach, describe, expect, it, vi } from "vitest";
import userEvent from "@testing-library/user-event";
import { renderWithProviders, screen } from "@/test/render";

const hook = {
  shouldShow: true,
  isIOS: false,
  promptInstall: vi.fn().mockResolvedValue(undefined),
  snooze: vi.fn(),
};

vi.mock("../../hooks/useInstallPrompt", () => ({
  useInstallPrompt: () => hook,
}));

import { InstallBanner } from "../InstallBanner";

beforeEach(() => {
  hook.shouldShow = true;
  hook.isIOS = false;
  hook.promptInstall.mockClear();
  hook.snooze.mockClear();
});

describe("InstallBanner", () => {
  it("renders nothing when not eligible", () => {
    hook.shouldShow = false;
    const { container } = renderWithProviders(<InstallBanner />);
    expect(container).toBeEmptyDOMElement();
  });

  it("shows the branded banner when eligible", () => {
    renderWithProviders(<InstallBanner />);
    expect(screen.getByText("Install Cradlen")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Install" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Not now" })).toBeInTheDocument();
  });

  it("calls snooze when 'Not now' is clicked", async () => {
    renderWithProviders(<InstallBanner />);
    await userEvent.click(screen.getByRole("button", { name: "Not now" }));
    expect(hook.snooze).toHaveBeenCalledTimes(1);
  });

  it("fires the native prompt on non-iOS Install", async () => {
    renderWithProviders(<InstallBanner />);
    await userEvent.click(screen.getByRole("button", { name: "Install" }));
    expect(hook.promptInstall).toHaveBeenCalledTimes(1);
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("opens the iOS instructions sheet on iOS Install", async () => {
    hook.isIOS = true;
    renderWithProviders(<InstallBanner />);
    await userEvent.click(screen.getByRole("button", { name: "Install" }));
    expect(hook.promptInstall).not.toHaveBeenCalled();
    expect(
      screen.getByRole("dialog", { name: "Add Cradlen to your Home Screen" }),
    ).toBeInTheDocument();
  });
});
