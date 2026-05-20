import fs from "fs";
import { parseDat } from "../pipeline/datParser.ts";
import { BinaryReader } from "../pipeline/binaryReader.ts";
import { decompressLayer } from "../pipeline/layerDecoder.ts";
import { tileIdFromByte } from "../pipeline/tiles.ts";

const datPath = process.argv[2] ?? "C:/games/Chips_Challenge_1/CHIPS.DAT";
const levelNum = Number(process.argv[3] ?? 7);
const buf = fs.readFileSync(datPath);

const doc = parseDat(buf, "CHIPS.DAT");
const level = doc.levels[levelNum - 1];

const reader = new BinaryReader(buf);
reader.readUInt32LE();
reader.readUInt16LE();
for (let i = 1; i < levelNum; i++) {
  const levelStart = reader.position;
  const levelByteLength = reader.readUInt16LE();
  reader.seek(levelStart + 2 + levelByteLength);
}

const levelStart = reader.position;
const levelByteLength = reader.readUInt16LE();
const levelEnd = levelStart + 2 + levelByteLength;
reader.readUInt16LE();
reader.readUInt16LE();
reader.readUInt16LE();
reader.readUInt16LE();
const upperLen = reader.readUInt16LE();
const upperCompressed = reader.readBytes(upperLen);
const upperBytes = decompressLayer(upperCompressed);

const w = 32;
for (const [x, y] of [
  [19, 11],
  [13, 19],
  [21, 12],
]) {
  const i = y * w + x;
  const b = upperBytes[i];
  console.log(
    `(${x},${y}) raw=0x${b.toString(16)} fromByte=${tileIdFromByte(b)} parsed=${level.layers.upper[i]}`,
  );
}
