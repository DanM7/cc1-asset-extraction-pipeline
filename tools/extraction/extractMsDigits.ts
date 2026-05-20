/**
 * Extract tight 7-segment digit PNGs (green + yellow rows) from spritesheet_window.png.
 * Run from cc1-asset-extraction-pipeline: npm run ms:digits
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import sharp from "sharp";

import { resolveGamePackRoot } from "../gamePackOut.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const GAME_PACK = resolveGamePackRoot();
const SHEET = path.join(GAME_PACK, "sprites/spritesheet_window.png");
const OUT_DIR = path.join(GAME_PACK, "sprites/digits");
const OUT_JSON = path.join(OUT_DIR, "digits.json");

const STRIP_LEFT = 12;
const STRIP_W = 195;
const STRIP_H = 22;
/** Green row (top of the pair in the rip). */
const STRIP_TOP_GREEN = 353;
/** Yellow row (bottom); chips-left zero state. */
const STRIP_TOP_YELLOW = 374;
const CHARS = "0123456789-";

type LitFn = (r: number, g: number, b: number) => boolean;

const isGreenLit: LitFn = (r, g, b) => g > 200 && g > r + 30 && b < 90;
const isYellowLit: LitFn = (r, g, b) => r > 200 && g > 180 && b < 90 && r >= g - 20;

function findGaps(data: Buffer, w: number, h: number, isLit: LitFn): Array<[number, number]> {
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
  return gaps;
}

async function extractRow(
  stripTop: number,
  isLit: LitFn,
  outSubdir: string,
  gapColumns?: Array<[number, number]>,
): Promise<Record<string, { file: string; x: number; y: number; width: number; height: number; slotWidth: number }>> {
  const { data, info } = await sharp(SHEET)
    .extract({ left: STRIP_LEFT, top: stripTop, width: STRIP_W, height: STRIP_H })
    .raw()
    .toBuffer({ resolveWithObject: true });

  const w = info.width;
  const h = info.height;
  const gaps = gapColumns ?? findGaps(data, w, h, isLit);
  if (gaps.length < 11) {
    throw new Error(
      `Expected 11 digit columns at strip top ${stripTop}, found ${gaps.length} in ${outSubdir}`,
    );
  }

  const paletteDir = path.join(OUT_DIR, outSubdir);
  fs.mkdirSync(paletteDir, { recursive: true });

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
        const idx = (y * w + x) * 3;
        if (!isLit(data[idx]!, data[idx + 1]!, data[idx + 2]!)) continue;
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      }
    }

    const cropX = STRIP_LEFT + minX;
    const cropY = stripTop + minY;
    const cropW = maxX - minX + 1;
    const cropH = maxY - minY + 1;
    const fileName = ch === "-" ? "dash.png" : `${ch}.png`;

    await sharp(SHEET)
      .extract({ left: cropX, top: cropY, width: cropW, height: cropH })
      .png()
      .toFile(path.join(paletteDir, fileName));

    manifest[ch] = {
      file: fileName,
      x: cropX,
      y: cropY,
      width: cropW,
      height: cropH,
      slotWidth: x1 - x0 + 1,
    };
  }

  return manifest;
}

async function main(): Promise<void> {
  const greenStrip = await sharp(SHEET)
    .extract({ left: STRIP_LEFT, top: STRIP_TOP_GREEN, width: STRIP_W, height: STRIP_H })
    .raw()
    .toBuffer({ resolveWithObject: true });
  const greenGaps = findGaps(
    greenStrip.data,
    greenStrip.info.width,
    greenStrip.info.height,
    isGreenLit,
  );

  const green = await extractRow(STRIP_TOP_GREEN, isGreenLit, "green", greenGaps);
  const yellow = await extractRow(STRIP_TOP_YELLOW, isYellowLit, "yellow", greenGaps);

  fs.writeFileSync(
    OUT_JSON,
    JSON.stringify(
      {
        source: "spritesheet_window.png",
        cellWidth: 14,
        chars: CHARS,
        palettes: {
          green: {
            strip: { left: STRIP_LEFT, top: STRIP_TOP_GREEN, width: STRIP_W, height: STRIP_H },
            glyphs: green,
          },
          yellow: {
            strip: { left: STRIP_LEFT, top: STRIP_TOP_YELLOW, width: STRIP_W, height: STRIP_H },
            glyphs: yellow,
          },
        },
      },
      null,
      2,
    ),
  );

  console.log(`Wrote green (y=${STRIP_TOP_GREEN}) + yellow (y=${STRIP_TOP_YELLOW}) digits to ${OUT_DIR}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
