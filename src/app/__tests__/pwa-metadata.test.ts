import { describe, it, expect } from "vitest";
import { pwaMetadata, pwaViewport } from "../pwa-metadata";

describe("pwa metadata", () => {
  it("links the manifest and apple touch icon", () => {
    expect(pwaMetadata.manifest).toBe("/manifest.webmanifest");
    const apple = pwaMetadata.icons as { apple?: unknown };
    expect(apple.apple).toBeTruthy();
  });

  it("marks the app as apple web app capable", () => {
    const awa = pwaMetadata.appleWebApp as { capable?: boolean; title?: string };
    expect(awa.capable).toBe(true);
    expect(awa.title).toBe("Cradlen");
  });

  it("sets a theme color in the viewport", () => {
    expect(pwaViewport.themeColor).toBeTruthy();
  });
});
