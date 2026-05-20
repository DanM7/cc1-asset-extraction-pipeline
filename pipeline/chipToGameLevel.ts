import { countCollectiblesOnMap } from "@engine/countCollectibles.js";
import { compactLayer } from "@engine/levelLayers.js";
import type { LevelData } from "@engine/types.js";
import { CHIP_TILE_IDS, CC1_MAP_SIZE } from "@tile-engine/tiles.js";
import { MS_TILE_SIZE } from "@tile-engine/msTileIndex.js";
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

/** Convert parsed DAT level into game JSON (compact layers, engine-owned schema). */
export function chipLevelToGameLevel(chip: ChipLevel, id?: string): LevelData {
  const start = findChipStart(chip);
  const levelId = id ?? `level-${String(chip.levelNumber).padStart(3, "0")}`;

  const hudSource: LevelData = {
    id: levelId,
    name: chip.metadata.title ?? `Level ${chip.levelNumber}`,
    ruleset: "grid-arcade-v1",
    contentPack: "ms-cc1",
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
    trapLinks: chip.trapLinks,
    cloneLinks: chip.cloneLinks,
    playerStart: start ?? { x: Math.floor(CC1_MAP_SIZE / 2), y: Math.floor(CC1_MAP_SIZE / 2) },
    metadata: chip.metadata,
  };

  return {
    ...hudSource,
    hud: buildLevelHud(chip, countCollectiblesOnMap(hudSource)),
    layers: {
      lower: compactLayer(chip.layers.lower),
      upper: compactLayer(chip.layers.upper),
    },
  };
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
      initial: required,
    },
  };
}
