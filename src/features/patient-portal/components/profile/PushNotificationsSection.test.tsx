import { beforeEach, describe, expect, it, vi } from "vitest";
import userEvent from "@testing-library/user-event";
import { renderWithProviders, screen } from "@/test/render";

const { push } = vi.hoisted(() => ({
  push: {
    status: "default" as string,
    busy: false,
    supported: true,
    enable: vi.fn(),
    disable: vi.fn(),
    resync: vi.fn(),
  },
}));
vi.mock("@/features/push/hooks/usePushSubscription", () => ({
  usePushSubscription: () => push,
}));
vi.mock("@/features/pwa/lib/platform", () => ({ isIOS: () => false }));

import { PushNotificationsSection } from "./PushNotificationsSection";

beforeEach(() => {
  push.status = "default";
  push.busy = false;
  push.supported = true;
  push.enable.mockClear();
  push.disable.mockClear();
});

describe("PushNotificationsSection", () => {
  it("renders the switch when supported", () => {
    renderWithProviders(<PushNotificationsSection />);
    expect(screen.getByText("Notifications")).toBeInTheDocument();
    expect(screen.getByRole("switch")).toBeInTheDocument();
  });

  it("calls enable when toggled on from default", async () => {
    renderWithProviders(<PushNotificationsSection />);
    await userEvent.click(screen.getByRole("switch"));
    expect(push.enable).toHaveBeenCalledTimes(1);
  });

  it("calls disable when toggled off from subscribed", async () => {
    push.status = "subscribed";
    renderWithProviders(<PushNotificationsSection />);
    await userEvent.click(screen.getByRole("switch"));
    expect(push.disable).toHaveBeenCalledTimes(1);
  });

  it("shows the denied note and no switch when blocked", () => {
    push.status = "denied";
    renderWithProviders(<PushNotificationsSection />);
    expect(screen.getByText(/blocked/i)).toBeInTheDocument();
    expect(screen.queryByRole("switch")).toBeNull();
  });

  it("renders nothing when unsupported on a non-iOS device", () => {
    push.status = "unsupported";
    push.supported = false;
    const { container } = renderWithProviders(<PushNotificationsSection />);
    expect(container).toBeEmptyDOMElement();
  });
});
