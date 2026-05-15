# Development notes — MS Chip's Challenge web port

This document records problems encountered while building the Phaser/TypeScript prototype, questions that came up, and how they were resolved. It is meant for anyone continuing work on tile extraction, rendering, or display scaling.

## Project goals (context)

- Drive gameplay from **original MS files** (`CHIPS.DAT`, `CHIPS.EXE`), not hand-drawn replacements.
- Keep proprietary assets **out of git** (`vendor/`, zip at repo root — see [VENDOR_SETUP.md](../VENDOR_SETUP.md)).
- Faithful level layout from `CHIPS.DAT` and faithful tile **shapes** from `CHIPS.EXE` (`OBJ32_4` bitmap).

---

## Licensed assets and repo layout

**Question:** How do we use the purchased game without committing it?

**Approach:**

- `vendor/chips-challenge-ms/` is gitignored and holds `CHIPS.DAT`, `CHIPS.EXE`, audio, and generated output.
- `npm run vendor:ensure` unpacks `chips_challenge.zip` when present.
- `npm run ms:extract` builds `vendor/chips-challenge-ms/generated/tiles.png`.
- `npm run dat:level1` (or `dat-to-json`) exports levels to `public/games/chips-challenge-100/levels/`.
- Vite serves `/ms-assets/` and `/ms-audio/` from `vendor/` in dev and copies them on build.

---

## Tile sheet extraction (`CHIPS.EXE` @ `0xD800`)

### Wrong shapes (garbled tiles)

**Symptom:** Tiles looked like noise or wrong patterns.

**Causes and fixes:**

1. **Treating OBJ32_4 as raw uncompressed 4bpp** — it is **BI_RLE4** (compression type 2). Must decode RLE, not read nibbles row-by-row from the bitstream start.
2. **Truncating RLE at the first `00 01` end-of-bitmap marker** — the stream continues; use the **last** `00 01` before the next embedded DIB (`OBJ32_4E` at `0x1F800`). That yields ~73KB of bit data instead of ~48KB.
3. **Hand-rolled `decodeBmpRle4` in `src/dat/bmpRle4.ts`** — useful for experiments but was buggy; **production path uses `bmp-js`** on a valid in-memory `.bmp` built from the DIB header + color table + RLE bits.

**Pipeline today** (`scripts/extractMsTiles.ts`):

1. Scan `CHIPS.EXE` from `0xD868` to `0x1F800` for the final `00 01` RLE terminator.
2. Wrap the embedded DIB in a standard BMP file header.
3. Decode with `bmp-js`, convert pixel buffer with `bmpJsDataToRgba()` (see colors below).
4. Write `vendor/.../generated/tiles.png` (416×512, 13×16 grid of 32×32 tiles).

### Frame index mapping

MS `CHIPS.EXE` positions tiles via `GetTileImagePos` (see [magical/CHIPS.EXE](https://github.com/magical/CHIPS.EXE) disassembly):

- `x = (tile & 0xF0) >> 4` → column × 32  
- `y = (tile & 0x0F)` → row × 32  

For object codes `0x00`–`0x6F` this matches:

```text
frame = (code % 16) * 13 + floor(code / 16)
```

Implemented in `src/dat/msObjectToFrame.ts` and `src/engine/msTileFrames.ts`.

---

## Tile colors

### Everything looked blue / blue-gray

**Symptom:** Layout and shapes correct, but walls, floor, and keys all skewed blue/cyan.

**Wrong track:** Replacing the embedded BMP color table with a **CGA “170” palette** before decode. The EXE already embeds the standard **Windows VGA 16-color** table (128-based RGB). Patching that table to a different standard made indices map to the wrong hues (e.g. wall pixels still index 6, but index 6 became cyan instead of teal/gray).

**Actual bug:** **`bmp-js` output layout is `[0, B, G, R]` per pixel**, not `[R, G, B, A]`. Passing the buffer straight to `sharp` as RGBA swapped channels and put **red in the alpha slot** (often dropped), so most art looked blue-heavy.

**Fix:** `src/dat/bmpJsToRgba.ts` reorders to `[R, G, B, A]` before PNG export. Keep the **embedded VGA palette** from the EXE; do not patch it for display.

**Reference:** Embedded palette matches classic MS VGA order (black, maroon, green, olive, navy, purple, teal, silver, …). Documented in `src/dat/msDisplayPalette.ts` as `MS_VGA_PALETTE` for reference only.

**Note:** MS walls in the bitmap use gray/teal VGA indices; the familiar **blue playfield** in the original game comes largely from the separate **background** bitmap (`s_background` in `CHIPS.EXE`), not from the floor tile sprite alone. Compositing and masked columns (tiles drawn with transparency over floor) are not fully implemented yet.

### Cache busting

After regenerating tiles, bump the query string on the spritesheet URL in `PlayScene.ts` (e.g. `tiles.png?v=5`) and hard-refresh the browser.

---

## Display resolution and zoom

### Browser zoom looks blurry

**Question:** Can we zoom in and keep aspect ratio without blur?

**Answer:** **Browser zoom** (Ctrl+scroll) scales the whole page with smoothing — bad for pixel art. Use the in-game **+ / −** controls (or `+` / `-` keys), which apply **integer** scale via Phaser’s `scale.zoom` while `FIT` preserves aspect ratio.

### Black game area (no tiles visible)

**Symptoms:** UI (zoom, d-pad) visible; inner playfield black; sometimes brief correct frames.

**Causes and fixes:**

1. **Flex layout:** `game-container` had no reliable height (`flex: 1` + `min-height: 0` only). Phaser’s scale manager saw **0×0 parent** and sized the canvas to nothing.  
   **Fix:** `aspect-ratio: 1024 / 1080`, `min-height: 200px`, and `max-height` on `.game-container` in `src/style.css`.

2. **Infinite recursion (stack overflow):** `applyIntegerDisplayZoom()` called `scale.refresh()`, which emitted Phaser’s **`resize`** event, which called `onDisplayResize()` again, forever.  
   **Fix:** Remove `scale.refresh()`; do **not** listen to `Scale.Events.RESIZE` for zoom; use **ResizeObserver** on `#game-container` and `pixel-zoom-changed` only; guard with `applyingZoom` in `src/engine/pixelZoom.ts`.

### Internal game size

- Canvas logical size: **1024×1080** (32×32 cells at **32px** per cell, plus small header/footer bands).
- `render.pixelArt: true`, `roundPixels: true`, `NEAREST` texture filtering on sprites.
- CSS: `image-rendering: pixelated` / `crisp-edges` on the canvas.

---

## Tests and scripts

| Command | Purpose |
|---------|---------|
| `npm run ms:extract` | Regenerate `tiles.png` from `CHIPS.EXE` |
| `npm run dat:level1` | Export level 1 JSON from `CHIPS.DAT` |
| `npm test` | Includes `test/datParser.test.ts`, `test/bmpRle4.test.ts` |

`test/bmpRle4.test.ts` checks decoded PNG dimensions and that floor/wall sample colors differ (sanity check after BGR fix).

---

## Known follow-ups (not solved here)

- **Masked compositing** for MS transparent tiles (keys, chip over non-floor cells) — original uses multiple `BitBlt` passes with mask columns in the sheet (Tile World “masked format” columns 7–12).
- **Background bitmap** from `CHIPS.EXE` for authentic blue playfield behind the grid.
- **Low-color tileset** `OBJ32_4E` at `0x1F800` — same palette as `OBJ32_4`; EGA path in original selects it when `ColorMode == 2`.
- **Full CC rules** — movement, monsters, audio, all 149 levels.

---

## Quick troubleshooting

| Problem | Check |
|---------|--------|
| No tiles / load error | `vendor/chips-challenge-ms/` present? Run `npm run vendor:ensure && npm run ms:extract` |
| Old colors after extract | Hard refresh; bump `?v=` on spritesheet URL |
| Black canvas | Browser console for stack overflow; confirm latest `pixelZoom.ts` (no `refresh()` in zoom path) |
| Blurry pixels | Use in-game zoom, not browser zoom; confirm `bmpJsDataToRgba` runs in extract script |
| Wrong tile graphics | Confirm RLE end scan uses **last** `00 01` before `0x1F800` |
