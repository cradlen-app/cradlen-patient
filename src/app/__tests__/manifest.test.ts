import { describe, it, expect } from "vitest";
import manifest from "../manifest";

describe("web app manifest", () => {
  const m = manifest();

  it("is installable and locale-neutral", () => {
    expect(m.start_url).toBe("/");
    expect(m.scope).toBe("/");
    expect(m.display).toBe("standalone");
    expect(m.name).toBeTruthy();
    expect(m.short_name).toBeTruthy();
    expect(m.theme_color).toBeTruthy();
    expect(m.background_color).toBeTruthy();
  });

  it("ships a maskable 512 icon and standard sizes", () => {
    const icons = m.icons ?? [];
    expect(icons.some((i) => i.sizes === "192x192")).toBe(true);
    expect(icons.some((i) => i.sizes === "512x512" && i.purpose === "any")).toBe(true);
    expect(icons.some((i) => i.sizes === "512x512" && i.purpose === "maskable")).toBe(true);
  });
});
