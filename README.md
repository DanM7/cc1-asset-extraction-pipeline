# cc1-asset-extraction-pipeline

Standalone tooling to read licensed MS Chip's Challenge files (`CHIPS.EXE`, `CHIPS.DAT`) and **write results into the game repo** — not into this repository's tree (except gitignored `vendor/`).

## Architecture

```text
CHIPS.DAT / CHIPS.EXE  →  [this repo: parse / rip]  →  chips-challenge-web/public/games/chips-challenge-1/
                              ↓ uses
                         @danm7/2d-tile-engine (LevelData, tiles, compact layers)
                              ↓ loaded by
                         chips-challenge-web + loadLevel()
```

See [docs/EXPORT.md](./docs/EXPORT.md) for paths and environment variables.

## Layout

| Path | Role |
|------|------|
| `pipeline/` | DAT parsers, `chipLevelToGameLevel` (engine schema), CLI |
| `tools/extraction/` | EXE tile rip, digit rip, reference TSV → JSON |
| `tools/gamePackOut.mjs` | Resolves output directory in the web client |
| `data/` | Optional sample DAT for tests |
| `vendor/` | **gitignored** — your install / generated `tiles.png` |

## Prerequisites

Clone siblings:

```text
DanM7/
  2d-tile-engine/
  cc1-asset-extraction-pipeline/   ← this repo
  chips-challenge-web/
```

```bash
npm install
npm run vendor:ensure
```

## Commands

```bash
npm test

# Level JSON → game pack (path is your choice; web uses public/games/chips-challenge-1/levels/)
npm run dat-to-json -- vendor/chips-challenge-ms/CHIPS.DAT ../chips-challenge-web/apps/chips-challenge-web/public/games/chips-challenge-1/levels/level-001.json --level 1

# Password / bold-time reference → game pack data/
npm run data:original-levels

# HUD digits → game pack sprites/digits/ (requires window spritesheet there)
npm run ms:digits
```

From **chips-challenge-web**, `npm run dat:levels` wraps the same CLI with install-path detection.

**Windows:** Never redirect output to `NUL` inside this repo — that creates a reserved-name file. `NUL` is gitignored.

## Related repos

- **[2d-tile-engine](https://github.com/danm7/2d-tile-engine)** — owns `LevelData`, tile ids, simulation
- **[chips-challenge-web](https://github.com/danm7/chips-challenge-web)** — committed game pack + Phaser client
