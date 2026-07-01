import { beforeEach, describe, expect, it, vi } from "vitest";
import { act, renderWithProviders, screen } from "@/test/render";

// Drive connectivity deterministically; the component owns the flash logic.
let online = true;
vi.mock("../../hooks/useOnlineStatus", () => ({
  useOnlineStatus: () => online,
}));

import { OfflineBar } from "../OfflineBar";

beforeEach(() => {
  online = true;
});

describe("OfflineBar", () => {
  it("renders nothing while online on first load", () => {
    const { container } = renderWithProviders(<OfflineBar />);
    expect(container).toBeEmptyDOMElement();
  });

  it("shows the offline message when offline", () => {
    online = false;
    renderWithProviders(<OfflineBar />);
    expect(screen.getByRole("status")).toHaveTextContent("You're offline");
  });

  it("flashes 'back online' then hides after reconnect", () => {
    vi.useFakeTimers();
    try {
      online = false;
      const { rerender } = renderWithProviders(<OfflineBar />);

      online = true;
      rerender(<OfflineBar />);
      expect(screen.getByRole("status")).toHaveTextContent("Back online");

      act(() => {
        vi.advanceTimersByTime(2000);
      });
      expect(screen.queryByRole("status")).toBeNull();
    } finally {
      vi.useRealTimers();
    }
  });
});
