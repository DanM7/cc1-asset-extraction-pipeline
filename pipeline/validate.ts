import type { ChipDatFile, ChipLevel } from "./types.js";

export interface ValidationWarning {
  levelNumber: number;
  message: string;
}

export function validateChipLevel(level: ChipLevel): ValidationWarning[] {
  const warnings: ValidationWarning[] = [];
  const { width, height } = level.size;
  const expected = width * height;

  if (level.layers.lower.length !== expected) {
    warnings.push({
      levelNumber: level.levelNumber,
      message: `lower layer length ${level.layers.lower.length} !== ${width}×${height} (${expected})`,
    });
  }
  if (level.layers.upper.length !== expected) {
    warnings.push({
      levelNumber: level.levelNumber,
      message: `upper layer length ${level.layers.upper.length} !== ${width}×${height} (${expected})`,
    });
  }

  for (const monster of level.monsters) {
    if (monster.x < 0 || monster.x >= width || monster.y < 0 || monster.y >= height) {
      warnings.push({
        levelNumber: level.levelNumber,
        message: `monster at (${monster.x},${monster.y}) out of bounds`,
      });
    }
  }

  return warnings;
}

export function validateChipDatFile(doc: ChipDatFile): ValidationWarning[] {
  const warnings: ValidationWarning[] = [];

  if (doc.levels.length !== doc.levelCount) {
    warnings.push({
      levelNumber: 0,
      message: `levelCount ${doc.levelCount} !== parsed levels ${doc.levels.length}`,
    });
  }

  for (const level of doc.levels) {
    warnings.push(...validateChipLevel(level));
  }

  return warnings;
}

export function logValidationWarnings(warnings: ValidationWarning[]): void {
  for (const w of warnings) {
    const prefix = w.levelNumber > 0 ? `Level ${w.levelNumber}` : "DAT";
    console.warn(`[validate] ${prefix}: ${w.message}`);
  }
}
