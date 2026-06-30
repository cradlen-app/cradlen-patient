import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import { describe, it, expect } from "vitest";

function pngSize(path: string) {
  const buf = readFileSync(path);
  // PNG IHDR width/height are big-endian uint32 at byte offsets 16 and 20.
  return { width: buf.readUInt32BE(16), height: buf.readUInt32BE(20) };
}

const ICONS = "public/icons";
const cases: [string, number, number][] = [
  ["icon-192.png", 192, 192],
  ["icon-512.png", 512, 512],
  ["icon-maskable-512.png", 512, 512],
  ["apple-touch-icon.png", 180, 180],
];

describe("pwa icons", () => {
  it.each(cases)("%s has correct dimensions", (file, w, h) => {
    const path = join(ICONS, file);
    expect(existsSync(path), `${path} should exist`).toBe(true);
    expect(pngSize(path)).toEqual({ width: w, height: h });
  });
});
