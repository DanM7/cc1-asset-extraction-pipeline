import { readFileSync, existsSync } from "fs";
import path from "path";
import { describe, expect, it } from "vitest";
import sharp from "sharp";

describe("MS tile sheet BMP (CHIPS.EXE)", () => {
  const pngPath = path.join(
    process.cwd(),
    "vendor",
    "chips-challenge-ms",
    "generated",
    "tiles.png",
  );

  it.skipIf(!existsSync(pngPath))("tiles.png has distinct floor and wall colors with red in walls", async () => {
    const { data, info } = await sharp(pngPath).raw().toBuffer({ resolveWithObject: true });
    expect(info.width).toBe(416);
    expect(info.height).toBe(512);

    const w = info.width;
    const sample = (col: number, row: number): [number, number, number] => {
      const x = col * 32 + 16;
      const y = row * 32 + 16;
      const i = (y * w + x) * 4;
      return [data[i]!, data[i + 1]!, data[i + 2]!];
    };

    const floor = sample(0, 0);
    const wall = sample(0, 1);
    expect(floor).not.toEqual(wall);
    // Wall brick uses VGA index 1 (maroon) and 3 (olive); channel swap used to hide red.
    expect(wall[0]).toBeGreaterThan(80);
    expect(wall[1]).toBeGreaterThan(80);
  });
});
