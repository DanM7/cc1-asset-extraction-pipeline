import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import sharp from "sharp";
import bmp from "bmp-js";
import { bmpJsDataToRgba } from "../../pipeline/bmpJsToRgba.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, "..", "..");
const VENDOR = path.join(ROOT, "vendor", "chips-challenge-ms");
const EXE = path.join(VENDOR, "CHIPS.EXE");
const OUT_DIR = path.join(VENDOR, "generated");

const BITMAP_OFFSET = 0xd800;
const RLE_SCAN_START = 0xd868;
const RLE_SCAN_END = 0x1f800;
const COLS = 13;
const ROWS = 16;
const TILE = 32;

function findRleBitsEnd(exe: Buffer): number {
  let last = -1;
  for (let i = RLE_SCAN_START; i < RLE_SCAN_END - 1; i++) {
    if (exe[i] === 0 && exe[i + 1] === 1) {
      last = i + 2;
    }
  }
  if (last < 0) {
    throw new Error("RLE end marker (00 01) not found");
  }
  return last;
}

function dibToBmpFileBuffer(exe: Buffer, dibOffset: number, bitsEnd: number): Buffer {
  const headerSize = exe.readUInt32LE(dibOffset);
  const clrUsed = exe.readUInt32LE(dibOffset + 32) || 16;
  const dibSize = headerSize + clrUsed * 4;
  const bitsOffset = dibOffset + dibSize;

  const fileHeader = Buffer.alloc(14);
  const pixelOffset = 14 + dibSize;
  const fileSize = pixelOffset + (bitsEnd - bitsOffset);
  fileHeader.write("BM", 0);
  fileHeader.writeUInt32LE(fileSize, 2);
  fileHeader.writeUInt32LE(pixelOffset, 10);

  return Buffer.concat([
    fileHeader,
    exe.subarray(dibOffset, bitsOffset),
    exe.subarray(bitsOffset, bitsEnd),
  ]);
}

async function main(): Promise<void> {
  if (!fs.existsSync(EXE)) {
    console.error(`Missing ${EXE}`);
    process.exit(1);
  }

  const exe = fs.readFileSync(EXE);
  const bitsEnd = findRleBitsEnd(exe);
  const bmpBuf = dibToBmpFileBuffer(exe, BITMAP_OFFSET, bitsEnd);

  fs.mkdirSync(OUT_DIR, { recursive: true });
  fs.writeFileSync(path.join(OUT_DIR, "tiles-debug.bmp"), bmpBuf);

  const decoded = bmp.decode(bmpBuf);
  const rgba = bmpJsDataToRgba(decoded.data);
  const outPng = path.join(OUT_DIR, "tiles.png");
  await sharp(rgba, {
    raw: { width: decoded.width, height: decoded.height, channels: 4 },
  })
    .png()
    .toFile(outPng);

  fs.writeFileSync(
    path.join(OUT_DIR, "tiles.json"),
    `${JSON.stringify(
      {
        source: "CHIPS.EXE@0xD800",
        decoder: "bmp-js RLE4 + BGR→RGBA",
        tileSize: TILE,
        columns: COLS,
        rows: ROWS,
        sheetWidth: decoded.width,
        sheetHeight: decoded.height,
      },
      null,
      2,
    )}\n`,
    "utf8",
  );

  const w = decoded.width;
  const px = (col: number, row: number): [number, number, number] => {
    const x = col * 32 + 16;
    const y = row * 32 + 16;
    const i = (y * w + x) * 4;
    return [rgba[i]!, rgba[i + 1]!, rgba[i + 2]!];
  };
  console.log(`Wrote ${outPng}`);
  console.log(`  floor(0,0) rgb=${px(0, 0)} wall(0,1) rgb=${px(0, 1)}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
