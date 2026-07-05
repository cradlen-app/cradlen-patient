import sharp from "sharp";
import { mkdirSync } from "node:fs";

const SRC = "src/public/Logo.png";
const OUT = "public/icons";
mkdirSync(OUT, { recursive: true });

const brandBg = { r: 255, g: 255, b: 255, alpha: 1 };

async function plain(size, name) {
  await sharp(SRC)
    .resize(size, size, { fit: "contain", background: brandBg })
    .png()
    .toFile(`${OUT}/${name}`);
}

// Maskable: logo shrunk to the ~80% safe zone, padded on a solid background so
// Android's circular/squircle mask never clips the mark.
async function maskable(size, name) {
  const inner = Math.round(size * 0.8);
  const logo = await sharp(SRC)
    .resize(inner, inner, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toBuffer();
  await sharp({ create: { width: size, height: size, channels: 4, background: brandBg } })
    .composite([{ input: logo, gravity: "center" }])
    .png()
    .toFile(`${OUT}/${name}`);
}

await plain(192, "icon-192.png");
await plain(512, "icon-512.png");
await plain(180, "apple-touch-icon.png");
await maskable(512, "icon-maskable-512.png");
console.log("PWA icons generated.");
