import { describe, expect, it } from "vitest";
import { chipLevelToGameLevel } from "../pipeline/chipToGameLevel.js";
import type { ChipLevel } from "../pipeline/types.js";

function minimalChipLevel(overrides: Partial<ChipLevel> = {}): ChipLevel {
  const size = 32;
  const empty = Array.from({ length: size * size }, () => "empty");
  return {
    levelNumber: 4,
    size: { width: size, height: size },
    timeLimit: 150,
    chipsRequired: 9,
    layers: { lower: [...empty], upper: [...empty] },
    monsters: [],
    metadata: { title: "LESSON 4" },
    ...overrides,
  };
}

describe("chipLevelToGameLevel", () => {
  it("seeds chip counter from DAT chips-required, not visible chip count", () => {
    const upper = Array.from({ length: 32 * 32 }, () => "empty");
    upper[2 * 32 + 2] = "chip";
    upper[2 * 32 + 3] = "chip";
    const level = chipLevelToGameLevel(
      minimalChipLevel({
        chipsRequired: 9,
        layers: {
          lower: Array.from({ length: 32 * 32 }, () => "empty"),
          upper,
        },
      }),
    );
    expect(level.hud?.collectiblesOnMap).toBe(2);
    expect(level.hud?.chipCounter).toEqual({ mode: "remaining", initial: 9 });
    expect(level.chipsRequired).toBe(9);
  });

  it("exports compact layers for the game pack", () => {
    const level = chipLevelToGameLevel(minimalChipLevel());
    expect(level.layers.lower).toEqual({ emptyPrefix: 1024, tiles: [] });
    expect(level.layers.upper).toEqual({ emptyPrefix: 1024, tiles: [] });
  });
});
