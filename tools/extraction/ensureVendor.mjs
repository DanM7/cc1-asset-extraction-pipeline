import fs from "fs";
import path from "path";
import { spawnSync } from "child_process";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const vendor = path.join(root, "vendor", "chips-challenge-ms");
const zipPath = path.join(root, "chips_challenge.zip");

function extractZip() {
  if (!fs.existsSync(zipPath)) return false;
  fs.mkdirSync(vendor, { recursive: true });
  const r = spawnSync("tar", ["-xf", zipPath, "-C", vendor], { stdio: "inherit" });
  if (r.status !== 0) {
    console.error("Failed to extract chips_challenge.zip");
    return false;
  }
  console.log("Extracted chips_challenge.zip → vendor/chips-challenge-ms/");
  return true;
}

function moveRootDat() {
  for (const name of ["CCLP.dat", "cclp.dat", "CHIPS.DAT", "chips.dat"]) {
    const src = path.join(root, name);
    if (fs.existsSync(src) && name !== "CHIPS.DAT") {
      fs.mkdirSync(vendor, { recursive: true });
      const dest = path.join(vendor, "CHIPS.DAT");
      if (!fs.existsSync(dest)) {
        fs.copyFileSync(src, dest);
        console.log(`Copied ${name} → vendor/chips-challenge-ms/CHIPS.DAT`);
      }
    }
  }
}

fs.mkdirSync(vendor, { recursive: true });
if (!fs.existsSync(path.join(vendor, "CHIPS.DAT"))) {
  extractZip();
}
moveRootDat();

const hasDat = fs.existsSync(path.join(vendor, "CHIPS.DAT"));
const hasExe = fs.existsSync(path.join(vendor, "CHIPS.EXE"));
if (!hasDat) {
  console.warn("vendor/chips-challenge-ms/CHIPS.DAT not found.");
  console.warn("Drop chips_challenge.zip at project root or add CHIPS.DAT to vendor/chips-challenge-ms/");
}

if (process.argv[1]?.includes("ensureVendor")) {
  // invoked via npm run vendor:ensure
}

