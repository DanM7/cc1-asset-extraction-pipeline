/**
 * Where extracted assets land — always outside this repo (the web game pack).
 *
 * Override: CC1_GAME_PACK_OUT=/absolute/path/to/public/games/chips-challenge-1
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PIPELINE_ROOT = path.join(__dirname, "..");

export const GAME_PACK_ID = "chips-challenge-1";

const DEFAULT_WEB_PACK = path.join(
  PIPELINE_ROOT,
  "..",
  "chips-challenge-web",
  "apps",
  "chips-challenge-web",
  "public",
  "games",
  GAME_PACK_ID,
);

/** Absolute path to `public/games/chips-challenge-1` in the web client. */
export function resolveGamePackRoot() {
  const fromEnv = process.env.CC1_GAME_PACK_OUT?.trim();
  const root = fromEnv ? path.resolve(fromEnv) : DEFAULT_WEB_PACK;
  if (!fs.existsSync(root)) {
    throw new Error(
      `Game pack directory not found: ${root}\n` +
        "Clone chips-challenge-web next to this repo or set CC1_GAME_PACK_OUT.",
    );
  }
  return root;
}

/** Web app root (for vendor/generated tiles next to public/). */
export function resolveWebAppRoot() {
  return path.join(resolveGamePackRoot(), "..", "..");
}
