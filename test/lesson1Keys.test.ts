import { existsSync, readFileSync } from "fs";
import { describe, expect, it } from "vitest";
import { parseDat } from "../pipeline/datParser.js";

const datPath = process.env.CC1_MS_INSTALL
  ? `${process.env.CC1_MS_INSTALL.replace(/\\/g, "/")}/CHIPS.DAT`
  : "vendor/chips-challenge-ms/CHIPS.DAT";

describe("LESSON 1 (CHIPS.DAT level 1)", () => {
  it.skipIf(!existsSync(datPath))("has one green key and two green doors on the top layer", () => {
    const doc = parseDat(readFileSync(datPath), "CHIPS.DAT");
    const level = doc.levels[0]!;
    expect(level.metadata.title).toBe("LESSON 1");

    const w = 32;
    let greenKeys = 0;
    let greenDoors = 0;
    for (let y = 0; y < 32; y++) {
      for (let x = 0; x < 32; x++) {
        const i = y * w + x;
        if (level.layers.upper[i] === "key_green") greenKeys += 1;
        if (level.layers.upper[i] === "door_green") greenDoors += 1;
      }
    }
    expect(greenKeys).toBe(1);
    expect(greenDoors).toBe(2);
  });
});
