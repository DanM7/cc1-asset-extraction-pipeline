#!/usr/bin/env node
import fs from "fs";
import path from "path";
import { chipLevelToGameLevel } from "./chipToGameLevel.js";
import { parseDat } from "./datParser.js";
import { logValidationWarnings, validateChipDatFile } from "./validate.js";

function usage(): never {
  console.error(`Usage:
  dat-to-json <input.dat> <output.json> [--level N]
  dat-to-json <input.dat> --extract <outputDir>   (writes level-NNN.json per level)

Examples:
  npm run dat-to-json -- data/CCLP.dat output/CCLP.json
  npm run dat-to-json -- data/CCLP.dat public/games/chips-challenge-100/levels/level-001.json --level 1`);
  process.exit(1);
}

function main(): void {
  const args = process.argv.slice(2);
  if (args.length < 2) usage();

  const inputPath = path.resolve(args[0]!);
  let outputPath: string | null = null;
  let extractDir: string | null = null;
  let levelOnly: number | null = null;

  for (let i = 1; i < args.length; i++) {
    const arg = args[i]!;
    if (arg === "--level" && args[i + 1]) {
      levelOnly = parseInt(args[++i]!, 10);
    } else if (arg === "--extract" && args[i + 1]) {
      extractDir = path.resolve(args[++i]!);
    } else if (!outputPath) {
      outputPath = path.resolve(arg);
    }
  }

  if (!extractDir && !outputPath) usage();

  if (!fs.existsSync(inputPath)) {
    console.error(`File not found: ${inputPath}`);
    console.error(`Place CHIPS.DAT in vendor/chips-challenge-ms/ (see vendor/README.md).`);
    process.exit(1);
  }

  const buffer = fs.readFileSync(inputPath);
  const sourceFile = path.basename(inputPath);
  const doc = parseDat(buffer, sourceFile);
  const warnings = validateChipDatFile(doc);
  logValidationWarnings(warnings);

  if (extractDir) {
    fs.mkdirSync(extractDir, { recursive: true });
    for (const level of doc.levels) {
      const gameLevel = chipLevelToGameLevel(level);
      const out = path.join(extractDir, `${gameLevel.id}.json`);
      fs.writeFileSync(out, `${JSON.stringify(gameLevel, null, 2)}\n`, "utf8");
    }
    console.log(`Wrote ${doc.levels.length} levels to ${extractDir}`);
    return;
  }

  if (levelOnly !== null) {
    const level = doc.levels.find((l) => l.levelNumber === levelOnly);
    if (!level) {
      console.error(`Level ${levelOnly} not found (file has ${doc.levelCount} levels).`);
      process.exit(1);
    }
    const gameLevel = chipLevelToGameLevel(level);
    fs.mkdirSync(path.dirname(outputPath!), { recursive: true });
    fs.writeFileSync(outputPath!, `${JSON.stringify(gameLevel, null, 2)}\n`, "utf8");
    console.log(`Wrote level ${levelOnly} (${gameLevel.name}) → ${outputPath}`);
    return;
  }

  fs.mkdirSync(path.dirname(outputPath!), { recursive: true });
  fs.writeFileSync(outputPath!, `${JSON.stringify(doc, null, 2)}\n`, "utf8");
  console.log(`Wrote ${doc.levelCount} levels → ${outputPath}`);
}

main();
