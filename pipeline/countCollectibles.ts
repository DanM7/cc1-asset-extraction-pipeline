import type { LevelData } from "./gameLevelTypes.js";

const DEFAULT_COLLECTIBLE_TILE_IDS = new Set(["chip"]);

function compositeAt(level: LevelData, x: number, y: number): string {
  const i = y * level.width + x;
  const upper = level.layers.upper[i] ?? "empty";
  if (upper !== "empty") return upper;
  return level.layers.lower[i] ?? "empty";
}

/** Count pickup collectibles still on the map (e.g. MS chip tiles). */
export function countCollectiblesOnMap(
  level: LevelData,
  tileIds: Set<string> = DEFAULT_COLLECTIBLE_TILE_IDS,
): number {
  let count = 0;
  for (let y = 0; y < level.height; y++) {
    for (let x = 0; x < level.width; x++) {
      if (tileIds.has(compositeAt(level, x, y))) {
        count++;
      }
    }
  }
  return count;
}
