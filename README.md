# cc1-asset-extraction-pipeline

Extract and convert MS Chip's Challenge assets from licensed `CHIPS.EXE` / `CHIPS.DAT` into game-ready JSON and PNG.

## Layout

| Path | Role |
|------|------|
| `pipeline/` | DAT/BMP parsers, level compiler, CLI |
| `tools/extraction/` | EXE tile rip, vendor bootstrap, reference data scripts |
| `data/` | Sample DAT files (add `CHIPS.DAT` under `vendor/` for full extract) |

## Setup

```bash
npm install
npm run vendor:ensure   # unpack licensed MS files into vendor/chips-challenge-ms
npm run ms:extract      # tiles.png from CHIPS.EXE
```

## Commands

```bash
npm test
npm run dat-to-json -- data/CCLP.dat output/level-001.json --level 1
```

## Related repos

- **[2d-tile-engine](https://github.com/danmaguire/2d-tile-engine)** — grid runtime (movement, inventory, HUD state)
- **[chips-challenge-web](https://github.com/danmaguire/chips-challenge-web)** — Phaser browser client consuming exported levels/assets

## Remote

```bash
git remote -v
# origin → https://github.com/danmaguire/cc1-asset-extraction-pipeline
```
