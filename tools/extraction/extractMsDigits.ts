/**
 * Extract tight 7-segment digit PNGs from spritesheet_window.png.
 * Run: npx tsx scripts/extractMsDigits.ts
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import sharp from "sharp";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, "..");
const SHEET = path.join(
  ROOT,
  "public/games/chips-challenge-100/sprites/spritesheet_window.png",
);
const OUT_DIR = path.join(ROOT, "public/games/chips-challenge-100/sprites/digits");
const OUT_JSON = path.join(OUT_DIR, "digits.json");

const STRIP_LEFT = 12;
const STRIP_TOP = 375;
const STRIP_W = 195;
const STRIP_H = 22;
const CHARS = "0123456789-";

function isLit(r: number, g: number, b: number): boolean {
  return g > 200 && g > 150 && b < 90;
}

async function main(): Promise<void> {
  const { data, info } = await sharp(SHEET)
    .extract({ left: STRIP_LEFT, top: STRIP_TOP, width: STRIP_W, height: STRIP_H })
    .raw()
    .toBuffer({ resolveWithObject: true });

  const w = info.width;
  const h = info.height;
  const colSum = new Array<number>(w).fill(0);
  for (let x = 0; x < w; x++) {
    for (let y = 0; y < h; y++) {
      const i = (y * w + x) * 3;
      if (isLit(data[i]!, data[i + 1]!, data[i + 2]!)) {
        colSum[x]!++;
      }
    }
  }

  const gaps: Array<[number, number]> = [];
  let inside = false;
  let start = 0;
  for (let x = 0; x < w; x++) {
    if (colSum[x]! > 0 && !inside) {
      start = x;
      inside = true;
    }
    if (colSum[x] === 0 && inside) {
      gaps.push([start, x - 1]);
      inside = false;
    }
  }
  if (inside) {
    gaps.push([start, w - 1]);
  }

  fs.mkdirSync(OUT_DIR, { recursive: true });
  const manifest: Record<
    string,
    { file: string; x: number; y: number; width: number; height: number; slotWidth: number }
  > = {};

  for (let i = 0; i < 11; i++) {
    const ch = CHARS[i]!;
    const [x0, x1] = gaps[i]!;
    let minX = 999;
    let minY = 999;
    let maxX = 0;
    let maxY = 0;
    for (let y = 0; y < h; y++) {
      for (let x = x0; x <= x1; x++) {
        const i = (y * w + x) * 3;
        if (!isLit(data[i]!, data[i + 1]!, data[i + 2]!)) continue;
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      }
    }

    const cropX = STRIP_LEFT + minX;
    const cropY = STRIP_TOP + minY;
    const cropW = maxX - minX + 1;
    const cropH = maxY - minY + 1;
    const fileName = ch === "-" ? "dash.png" : `${ch}.png`;

    await sharp(SHEET)
      .extract({ left: cropX, top: cropY, width: cropW, height: cropH })
      .png()
      .toFile(path.join(OUT_DIR, fileName));

    manifest[ch] = {
      file: fileName,
      x: cropX,
      y: cropY,
      width: cropW,
      height: cropH,
      slotWidth: x1 - x0 + 1,
    };
  }

  fs.writeFileSync(
    OUT_JSON,
    JSON.stringify(
      {
        source: "spritesheet_window.png",
        strip: { left: STRIP_LEFT, top: STRIP_TOP, width: STRIP_W, height: STRIP_H },
        cellWidth: 14,
        chars: CHARS,
        glyphs: manifest,
      },
      null,
      2,
    ),
  );

  console.log(`Wrote ${Object.keys(manifest).length} digits to ${OUT_DIR}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
