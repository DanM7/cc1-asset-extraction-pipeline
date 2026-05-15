# Licensed MS Chip's Challenge files

Original game files are **not** in git. Use your purchased copy as follows.

## Setup

1. Place `chips_challenge.zip` at the project root (or copy files manually).
2. Run:

```bash
npm run vendor:ensure   # extracts zip → vendor/chips-challenge-ms/
npm run ms:extract      # builds tiles.png from CHIPS.EXE
npm run dat:level1      # exports level 1 JSON for the web game
npm run dev
```

## Layout (gitignored)

```
vendor/chips-challenge-ms/
  CHIPS.DAT
  CHIPS.EXE
  *.WAV, *.MID
  generated/
    tiles.png    # from ms:extract
    tiles.json
```

Also gitignored: `chips_challenge.zip`, `output/`.
