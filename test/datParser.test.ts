import { readFileSync, existsSync } from "fs";
import path from "path";
import { describe, expect, it } from "vitest";
import { buildSyntheticDat, parseDat } from "../src/dat/datParser.js";
import { decodePassword } from "../src/dat/metadata.js";
import { validateChipDatFile } from "../src/dat/validate.js";
import { findChipStart } from "../src/dat/chipToGameLevel.js";

describe("parseDat (synthetic)", () => {
  it("parses header and one empty level with metadata", () => {
    const buffer = buildSyntheticDat([
      {
        timeLimit: 100,
        chipsRequired: 5,
        upperTiles: { "5,5": "chip_s", "0,0": "wall" },
        metadata: {
          title: "Lesson 1",
          hint: "Pick up chips.",
          passwordPlain: "BDHP",
        },
        monsters: [{ x: 3, y: 3, direction: "north" }],
      },
    ]);

    const doc = parseDat(buffer, "test.dat");
    expect(doc.levelCount).toBe(1);
    expect(doc.levels).toHaveLength(1);

    const level = doc.levels[0]!;
    expect(level.levelNumber).toBe(1);
    expect(level.timeLimit).toBe(100);
    expect(level.chipsRequired).toBe(5);
    expect(level.size).toEqual({ width: 32, height: 32 });
    expect(level.layers.lower).toHaveLength(1024);
    expect(level.layers.upper).toHaveLength(1024);
    expect(level.layers.upper[5 * 32 + 5]).toBe("chip_s");
    expect(level.layers.upper[0]).toBe("wall");
    expect(level.metadata.title).toBe("Lesson 1");
    expect(level.metadata.hint).toBe("Pick up chips.");
    expect(level.metadata.passwordPlain).toBe("BDHP");
    expect(level.monsters).toEqual([{ x: 3, y: 3, direction: "north" }]);

    const start = findChipStart(level);
    expect(start).toEqual({ x: 5, y: 5 });

    const warnings = validateChipDatFile(doc);
    expect(warnings).toHaveLength(0);
  });

  it("decodes XOR passwords", () => {
    const encoded = Buffer.from([0xdb, 0xdd, 0xd1, 0xc9, 0x00]);
    expect(decodePassword(encoded)).toBe("BDHP");
  });
});

describe("CHIPS.DAT integration", () => {
  const datPath = path.join(process.cwd(), "vendor", "chips-challenge-ms", "CHIPS.DAT");

  it.skipIf(!existsSync(datPath))("parses original MS level pack when vendor CHIPS.DAT is present", () => {
    const buffer = readFileSync(datPath);
    const doc = parseDat(buffer, "CHIPS.DAT");
    expect(doc.levelCount).toBe(149);
    expect(doc.levels.length).toBe(149);

    const first = doc.levels[0]!;
    expect(first.layers.lower).toHaveLength(1024);
    expect(first.layers.upper).toHaveLength(1024);
    expect(first.metadata.title).toBe("LESSON 1");
    expect(first.metadata.passwordPlain).toBe("BDHP");
  });
});
