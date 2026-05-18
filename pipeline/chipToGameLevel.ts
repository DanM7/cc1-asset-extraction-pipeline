import { countCollectiblesOnMap } from "./countCollectibles.js";
import type { LevelData } from "./gameLevelTypes.js";
import { BLOCKING_TILE_IDS, CHIP_TILE_IDS, CC1_MAP_SIZE } from "./tiles.js";
import { MS_TILE_SIZE } from "./msTileIndex.js";
import type { ChipLevel } from "./types.js";

export function findChipStart(level: ChipLevel): { x: number; y: number } | null {
  const { width } = level.size;
  for (let i = 0; i < level.layers.upper.length; i++) {
    const id = level.layers.upper[i]!;
    if (CHIP_TILE_IDS.has(id)) {
      return { x: i % width, y: Math.floor(i / width) };
    }
  }
  for (let i = 0; i < level.layers.lower.length; i++) {
    const id = level.layers.lower[i]!;
    if (CHIP_TILE_IDS.has(id)) {
      return { x: i % width, y: Math.floor(i / width) };
    }
  }
  return null;
}

export function isBlockingTile(tileId: string): boolean {
  return BLOCKING_TILE_IDS.has(tileId);
}

/** Convert parsed DAT level into runtime JSON for the Phaser client. */
export function chipLevelToGameLevel(chip: ChipLevel, id?: string): LevelData {
  const start = findChipStart(chip);
  const level: LevelData = {
    id: id ?? `level-${String(chip.levelNumber).padStart(3, "0")}`,
    name: chip.metadata.title ?? `Level ${chip.levelNumber}`,
    width: chip.size.width,
    height: chip.size.height,
    tileSize: MS_TILE_SIZE,
    timeLimit: chip.timeLimit,
    chipsRequired: chip.chipsRequired,
    layers: {
      lower: chip.layers.lower,
      upper: chip.layers.upper,
    },
    monsters: chip.monsters,
    playerStart: start ?? { x: Math.floor(CC1_MAP_SIZE / 2), y: Math.floor(CC1_MAP_SIZE / 2) },
    metadata: chip.metadata,
  };
  level.hud = buildLevelHud(chip, countCollectiblesOnMap(level));
  return level;
}

function buildLevelHud(chip: ChipLevel, collectiblesOnMap: number): LevelData["hud"] {
  const title = chip.metadata.title ?? `Level ${chip.levelNumber}`;
  const required = chip.chipsRequired;
  const time = chip.timeLimit;

  return {
    levelTitle: title,
    levelNumber: chip.levelNumber,
    collectiblesOnMap,
    timer:
      time > 0
        ? { mode: "countDown", initialSeconds: time }
        : { mode: "none", initialSeconds: 0 },
    chipCounter: {
      mode: "remaining",
      initial: collectiblesOnMap,
      required,
    },
    inventorySlots: [
      "key_blue",
      "key_red",
      "key_green",
      "key_yellow",
      "flippers",
      "fire_boots",
      "ice_skates",
      "suction_boots",
    ],
  };
}
