# Level data

**Original MS Chip's Challenge** files live in **`vendor/chips-challenge-ms/`** (gitignored).

1. Place `chips_challenge.zip` at the project root and run `npm run vendor:ensure`, or copy `CHIPS.DAT` / `CHIPS.EXE` into `vendor/chips-challenge-ms/` manually.
2. Run `npm run ms:extract` to build tile graphics from `CHIPS.EXE`.
3. Run `npm run dat:level1` to export level 1 into `public/.../levels/level-001.json`.

Community packs (e.g. CCLP) can also be copied to `vendor/` as separate `.dat` files for conversion with `npm run dat-to-json`.
