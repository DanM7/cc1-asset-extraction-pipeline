import { BinaryReader } from "./binaryReader.js";
import { decompressLayer } from "./layerDecoder.js";
import { parseOptionalFields } from "./metadata.js";
import type { ChipDatFile, ChipLevel } from "./types.js";
import {
  CC1_MAP_SIZE,
  CC1_TILE_COUNT,
  TILE_NAMES,
  tileIdsFromBytes,
} from "./tiles.js";

const MAGIC_MS = 0x0002aaac;
const MAGIC_LYNX = 0x0102aaac;

export interface ParseLevelResult {
  level: ChipLevel;
  nextOffset: number;
}

export function parseLevel(reader: BinaryReader, width = CC1_MAP_SIZE, height = CC1_MAP_SIZE): ParseLevelResult {
  const levelStart = reader.position;
  const levelByteLength = reader.readUInt16LE();
  const levelEnd = levelStart + 2 + levelByteLength;

  const levelNumber = reader.readUInt16LE();
  const timeLimit = reader.readUInt16LE();
  const chipsRequired = reader.readUInt16LE();
  const mapDetailFlag = reader.readUInt16LE();

  if (mapDetailFlag !== 0 && mapDetailFlag !== 1) {
    console.warn(`Level ${levelNumber}: unexpected map detail flag ${mapDetailFlag}`);
  }

  const upperLayerByteLength = reader.readUInt16LE();
  const upperCompressed = reader.readBytes(upperLayerByteLength);
  const lowerLayerByteLength = reader.readUInt16LE();
  const lowerCompressed = reader.readBytes(lowerLayerByteLength);

  const upperBytes = decompressLayer(upperCompressed);
  const lowerBytes = decompressLayer(lowerCompressed);
  const upper = tileIdsFromBytes(upperBytes);
  const lower = tileIdsFromBytes(lowerBytes);

  const optionalByteLength = reader.readUInt16LE();
  const optionalData = optionalByteLength > 0 ? reader.readBytes(optionalByteLength) : Buffer.alloc(0);

  const { metadata, monsters } = parseOptionalFields(optionalData, upper, width);

  if (reader.position !== levelEnd) {
    console.warn(
      `Level ${levelNumber}: parser at ${reader.position}, expected ${levelEnd} (delta ${levelEnd - reader.position})`,
    );
    reader.seek(levelEnd);
  }

  const level: ChipLevel = {
    levelNumber,
    timeLimit,
    chipsRequired,
    size: { width, height },
    layers: { lower, upper },
    monsters,
    metadata,
  };

  return { level, nextOffset: levelEnd };
}

export function parseDat(buffer: Buffer, sourceFile: string): ChipDatFile {
  const reader = new BinaryReader(buffer);
  const magic = reader.readUInt32LE();
  if (magic !== MAGIC_MS && magic !== MAGIC_LYNX) {
    throw new Error(
      `Invalid DAT magic 0x${magic.toString(16)} (expected 0x${MAGIC_MS.toString(16)} or Lynx 0x${MAGIC_LYNX.toString(16)})`,
    );
  }

  const levelCount = reader.readUInt16LE();
  const levels: ChipLevel[] = [];

  for (let i = 0; i < levelCount; i++) {
    if (reader.remaining < 2) {
      throw new Error(`Unexpected end of file before level ${i + 1}`);
    }
    const { level } = parseLevel(reader);
    levels.push(level);
  }

  if (levels.length !== levelCount) {
    throw new Error(`Header level count ${levelCount} but parsed ${levels.length}`);
  }

  return {
    sourceFile,
    magic,
    levelCount,
    levels,
  };
}

const BYTE_BY_TILE_NAME = new Map<string, number>(
  Object.entries(TILE_NAMES).map(([code, name]) => [name, Number(code)]),
);

function tileNameToByte(name: string): number {
  return BYTE_BY_TILE_NAME.get(name) ?? 0x00;
}

/** Standard empty lower layer encoding (1024 × empty). */
export function emptyLayerCompressed(): Buffer {
  return Buffer.from([0xff, 0xff, 0x00, 0xff, 0xff, 0x00, 0xff, 0xff, 0x00, 0xff, 0xff, 0x00, 0xff, 0x04, 0x00]);
}

function compressLayerFromNames(tileIds: string[]): Buffer {
  if (tileIds.length !== CC1_TILE_COUNT) {
    throw new Error(`Layer must be ${CC1_TILE_COUNT} tiles`);
  }
  const bytes: number[] = [];
  let i = 0;
  while (i < tileIds.length) {
    const tile = tileNameToByte(tileIds[i]!);
    let run = 1;
    while (i + run < tileIds.length && tileNameToByte(tileIds[i + run]!) === tile) {
      run += 1;
    }
    let remaining = run;
    while (remaining > 0) {
      const chunk = Math.min(remaining, 255);
      bytes.push(0xff, chunk, tile);
      remaining -= chunk;
    }
    i += run;
  }
  return Buffer.from(bytes);
}

/** Build a minimal valid DAT for tests. */
export function buildSyntheticDat(specs: SyntheticLevelSpec[]): Buffer {
  const chunks: Buffer[] = [];
  const header = Buffer.alloc(6);
  header.writeUInt32LE(MAGIC_MS, 0);
  header.writeUInt16LE(specs.length, 4);
  chunks.push(header);

  for (let i = 0; i < specs.length; i++) {
    const spec = specs[i]!;
    const levelBody = encodeLevelBody(spec, i + 1);
    const lenBuf = Buffer.alloc(2);
    lenBuf.writeUInt16LE(levelBody.length, 0);
    chunks.push(lenBuf, levelBody);
  }

  return Buffer.concat(chunks);
}

export interface SyntheticLevelSpec {
  timeLimit?: number;
  chipsRequired?: number;
  /** Sparse map: keys "x,y" → tile name (rest = empty). */
  upperTiles?: Record<string, string>;
  lowerTiles?: Record<string, string>;
  metadata?: ChipLevel["metadata"];
  monsters?: ChipLevel["monsters"];
}

function encodeLevelBody(spec: SyntheticLevelSpec, levelNumber: number): Buffer {
  const upper = sparseToLayer(spec.upperTiles ?? {});
  const lower = sparseToLayer(spec.lowerTiles ?? {});
  const upperCompressed = compressLayerFromNames(upper);
  const lowerCompressed =
    spec.lowerTiles && Object.keys(spec.lowerTiles).length > 0
      ? compressLayerFromNames(lower)
      : emptyLayerCompressed();

  const optional = encodeOptionalFields(spec.metadata, spec.monsters);
  const parts: Buffer[] = [];

  const fixed = Buffer.alloc(8);
  fixed.writeUInt16LE(levelNumber, 0);
  fixed.writeUInt16LE(spec.timeLimit ?? 100, 2);
  fixed.writeUInt16LE(spec.chipsRequired ?? 0, 4);
  fixed.writeUInt16LE(1, 6);
  parts.push(fixed);

  const uLen = Buffer.alloc(2);
  uLen.writeUInt16LE(upperCompressed.length, 0);
  parts.push(uLen, upperCompressed);

  const lLen = Buffer.alloc(2);
  lLen.writeUInt16LE(lowerCompressed.length, 0);
  parts.push(lLen, lowerCompressed);

  const oLen = Buffer.alloc(2);
  oLen.writeUInt16LE(optional.length, 0);
  parts.push(oLen, optional);

  return Buffer.concat(parts);
}

function sparseToLayer(cells: Record<string, string>): string[] {
  const layer = Array.from({ length: CC1_TILE_COUNT }, () => "empty");
  for (const [key, tile] of Object.entries(cells)) {
    const [xs, ys] = key.split(",");
    const x = Number(xs);
    const y = Number(ys);
    if (Number.isNaN(x) || Number.isNaN(y) || x < 0 || x >= CC1_MAP_SIZE || y < 0 || y >= CC1_MAP_SIZE) {
      throw new Error(`Invalid cell key ${key}`);
    }
    layer[y * CC1_MAP_SIZE + x] = tile;
  }
  return layer;
}

function encodeOptionalFields(
  metadata?: ChipLevel["metadata"],
  monsters?: ChipLevel["monsters"],
): Buffer {
  const parts: Buffer[] = [];
  if (metadata?.title) {
    const str = Buffer.from(`${metadata.title}\0`, "ascii");
    parts.push(Buffer.from([3, str.length]), str);
  }
  if (metadata?.hint) {
    const str = Buffer.from(`${metadata.hint}\0`, "ascii");
    parts.push(Buffer.from([7, str.length]), str);
  }
  if (metadata?.passwordPlain) {
    const encoded = Buffer.from(
      metadata.passwordPlain
        .split("")
        .map((c) => c.charCodeAt(0) ^ 0x99)
        .concat([0]),
    );
    parts.push(Buffer.from([6, encoded.length]), encoded);
  }
  if (monsters && monsters.length > 0) {
    const buf = Buffer.alloc(monsters.length * 2);
    monsters.forEach((m, i) => {
      buf[i * 2] = m.x;
      buf[i * 2 + 1] = m.y;
    });
    parts.push(Buffer.from([10, buf.length]), buf);
  }
  return Buffer.concat(parts);
}
