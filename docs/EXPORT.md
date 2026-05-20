# Export model

This repo is **standalone extraction tooling only**. It does not ship game content.

## What stays here (gitignored or sample)

| Path | Purpose |
|------|---------|
| `vendor/chips-challenge-ms/` | Your licensed `CHIPS.DAT`, `CHIPS.EXE`, zip unpack |
| `vendor/.../generated/tiles.png` | Rip from EXE (intermediate; web `predev` may copy to its vendor) |
| `output/` | Optional scratch if you pass a relative path to the CLI |
| `data/` | Tiny sample DAT for tests only |

## What is written to the game

All game-facing artifacts go to the **web client game pack**:

`chips-challenge-web/apps/chips-challenge-web/public/games/chips-challenge-1/`

Resolved by `tools/gamePackOut.mjs` (sibling repo layout) or:

```bash
set CC1_GAME_PACK_OUT=C:\path\to\public\games\chips-challenge-1
```

| Script | Output |
|--------|--------|
| `npm run dat-to-json -- … <out.json> --level N` | `levels/level-NNN.json` (you choose path; web scripts point at game pack) |
| `npm run data:original-levels` | `data/original-level-reference.json` |
| `npm run ms:digits` | `sprites/digits/` |

Level JSON schema (`LevelData`, compact layers, tile ids) is owned by **@danm7/2d-tile-engine**. The browser loads JSON via `loadLevel()` which expands compact layers before play.

## Dependency

```json
"@danm7/2d-tile-engine": "file:../2d-tile-engine"
```

Pipeline imports types, `compactLayer`, `countCollectiblesOnMap`, and `tile-engine/tiles` from the engine — no duplicate `gameLevelTypes` or `tiles.ts` logic in this repo.
