/**
 * 16-color palette embedded in CHIPS.EXE OBJ32_4 / OBJ32_4E (standard Windows VGA).
 * The game does not substitute a different table at decode time — bmp-js channel order was the bug.
 */
export const MS_VGA_PALETTE: ReadonlyArray<readonly [number, number, number]> = [
  [0, 0, 0],
  [128, 0, 0],
  [0, 128, 0],
  [128, 128, 0],
  [0, 0, 128],
  [128, 0, 128],
  [0, 128, 128],
  [128, 128, 128],
  [192, 192, 192],
  [255, 0, 0],
  [0, 255, 0],
  [255, 255, 0],
  [0, 0, 255],
  [255, 0, 255],
  [0, 255, 255],
  [255, 255, 255],
] as const;
