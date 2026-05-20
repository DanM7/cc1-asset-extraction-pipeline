import type { ChipLevel, CloneButtonLink, MonsterDirection, TrapButtonLink } from "./types.js";

const PASSWORD_XOR = 0x99;

/** Field type bytes in CC1 optional metadata. */
const FIELD_TITLE = 3;
const FIELD_TRAP_BUTTONS = 4;
const FIELD_CLONE_BUTTONS = 5;
const FIELD_PASSWORD = 6;
const FIELD_HINT = 7;
const FIELD_PASSWORD_PLAIN = 8;
const FIELD_MOVEMENT = 10;

export function decodePassword(bytes: Buffer): string {
  let out = "";
  for (let i = 0; i < bytes.length; i++) {
    const b = bytes[i]!;
    if (b === 0) break;
    out += String.fromCharCode(b ^ PASSWORD_XOR);
  }
  return out;
}

function readNullTerminatedString(data: Buffer, offset: number, length: number): string {
  const slice = data.subarray(offset, offset + length);
  const zero = slice.indexOf(0);
  const end = zero >= 0 ? zero : slice.length;
  return slice.subarray(0, end).toString("ascii");
}

function directionFromTileId(tileId: string): MonsterDirection {
  if (tileId.endsWith("_n")) return "north";
  if (tileId.endsWith("_e")) return "east";
  if (tileId.endsWith("_s")) return "south";
  if (tileId.endsWith("_w")) return "west";
  return "north";
}

export function parseOptionalFields(
  data: Buffer,
  upperTileIds: string[],
  width: number,
): Pick<ChipLevel, "metadata" | "monsters" | "trapLinks" | "cloneLinks"> {
  const metadata: ChipLevel["metadata"] = {};
  const monsters: ChipLevel["monsters"] = [];
  const trapLinks: TrapButtonLink[] = [];
  const cloneLinks: CloneButtonLink[] = [];
  let offset = 0;

  while (offset < data.length) {
    const fieldType = data[offset]!;
    const fieldLength = data[offset + 1]!;
    offset += 2;

    if (fieldLength > data.length - offset) {
      throw new Error(`Field ${fieldType} length ${fieldLength} exceeds remaining metadata`);
    }

    const fieldData = data.subarray(offset, offset + fieldLength);
    offset += fieldLength;

    switch (fieldType) {
      case FIELD_TITLE:
        metadata.title = readNullTerminatedString(fieldData, 0, fieldData.length);
        break;
      case FIELD_HINT:
        metadata.hint = readNullTerminatedString(fieldData, 0, fieldData.length);
        break;
      case FIELD_PASSWORD: {
        metadata.passwordHash = fieldData.toString("hex");
        metadata.passwordPlain = decodePassword(fieldData);
        break;
      }
      case FIELD_PASSWORD_PLAIN:
        metadata.passwordPlain = readNullTerminatedString(fieldData, 0, fieldData.length);
        metadata.passwordHash = Buffer.from(metadata.passwordPlain, "ascii").toString("hex");
        break;
      case FIELD_MOVEMENT:
        for (let i = 0; i + 1 < fieldData.length; i += 2) {
          const x = fieldData[i]!;
          const y = fieldData[i + 1]!;
          const tileId = upperTileIds[y * width + x] ?? "empty";
          monsters.push({
            x,
            y,
            direction: directionFromTileId(tileId),
          });
        }
        break;
      case FIELD_TRAP_BUTTONS:
        for (let i = 0; i + 9 < fieldData.length; i += 10) {
          trapLinks.push({
            button: { x: fieldData.readUInt16LE(i), y: fieldData.readUInt16LE(i + 2) },
            trap: { x: fieldData.readUInt16LE(i + 4), y: fieldData.readUInt16LE(i + 6) },
          });
        }
        break;
      case FIELD_CLONE_BUTTONS:
        for (let i = 0; i + 7 < fieldData.length; i += 8) {
          cloneLinks.push({
            button: { x: fieldData.readUInt16LE(i), y: fieldData.readUInt16LE(i + 2) },
            clone: { x: fieldData.readUInt16LE(i + 4), y: fieldData.readUInt16LE(i + 6) },
          });
        }
        break;
      default:
        break;
    }
  }

  return {
    metadata,
    monsters,
    trapLinks: trapLinks.length > 0 ? trapLinks : undefined,
    cloneLinks: cloneLinks.length > 0 ? cloneLinks : undefined,
  };
}
