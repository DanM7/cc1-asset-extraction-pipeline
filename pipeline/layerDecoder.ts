import { CC1_TILE_COUNT } from "./tiles.js";

/**
 * Decompress a CC1 map layer (RLE + $70–$9F / $A0–$CF shortcuts per seasip.info/ccfile.html).
 */
export function decompressLayer(data: Buffer): number[] {
  const tiles: number[] = [];
  let i = 0;

  while (tiles.length < CC1_TILE_COUNT && i < data.length) {
    const code = data[i]!;

    if (code === 0xff) {
      i += 1;
      if (i + 1 >= data.length) {
        throw new Error("Truncated RLE sequence in layer");
      }
      const count = data[i]!;
      const tile = data[i + 1]!;
      i += 2;
      for (let c = 0; c < count; c++) {
        if (tiles.length >= CC1_TILE_COUNT) break;
        tiles.push(tile);
      }
    } else if (code >= 0x70 && code <= 0x9f) {
      tiles.push(0x3f + (code - 0x70));
      i += 1;
    } else if (code >= 0xa0 && code <= 0xcf) {
      tiles.push(0x70 + (code - 0xa0));
      i += 1;
    } else {
      tiles.push(code);
      i += 1;
    }
  }

  if (tiles.length !== CC1_TILE_COUNT) {
    throw new Error(`Layer decoded to ${tiles.length} tiles, expected ${CC1_TILE_COUNT}`);
  }

  return tiles;
}
