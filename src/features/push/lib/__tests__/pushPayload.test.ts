import { describe, expect, it } from "vitest";
import { buildNotificationOptions } from "../pushPayload";

describe("buildNotificationOptions", () => {
  it("maps a full payload to notification options", () => {
    const { title, options } = buildNotificationOptions({
      title: "Result ready",
      body: "Your CBC result has been reviewed.",
      navigate_to: "/tests",
      tag: "notif-1",
    });
    expect(title).toBe("Result ready");
    expect(options.body).toBe("Your CBC result has been reviewed.");
    expect(options.icon).toBe("/icons/icon-192.png");
    expect(options.badge).toBe("/icons/icon-192.png");
    expect(options.tag).toBe("notif-1");
    expect(options.data).toEqual({ navigate_to: "/tests" });
  });

  it("defaults the title and null navigate_to when absent", () => {
    const { title, options } = buildNotificationOptions({ body: "hi" });
    expect(title).toBe("Cradlen");
    expect(options.data).toEqual({ navigate_to: null });
  });
});
