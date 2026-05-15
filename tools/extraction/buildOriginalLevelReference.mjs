import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const tsvPath = path.join(__dirname, "chips-original-levels.tsv");
const outPath = path.join(
  __dirname,
  "..",
  "public",
  "games",
  "chips-challenge-100",
  "data",
  "original-level-reference.json",
);

const raw = fs.readFileSync(tsvPath, "utf8");
const lines = raw.trim().split(/\r?\n/);
const [, ...rows] = lines;

const levels = rows.map((line) => {
  const parts = line.split("\t");
  if (parts.length < 6) {
    throw new Error(`Bad line (${parts.length} columns): ${line}`);
  }
  const [number, title, password, timeLimit, boldMs, boldLynx] = parts;
  const n = parseInt(number, 10);
  if (Number.isNaN(n)) {
    throw new Error(`Bad level number: ${line}`);
  }
  const pwParts = password.split("|");
  const passwordMs = pwParts[0];
  const passwordLynx = pwParts.length > 1 ? pwParts[1] : pwParts[0];
  const timeLimitSeconds = timeLimit === "---" ? null : parseInt(timeLimit, 10);
  const boldTargetMs = parseInt(boldMs, 10);
  const boldTargetLynx = boldLynx === "NA" ? null : parseInt(boldLynx, 10);
  if (Number.isNaN(boldTargetMs)) {
    throw new Error(`Bad bold MS: ${line}`);
  }
  if (boldTargetLynx !== null && Number.isNaN(boldTargetLynx)) {
    throw new Error(`Bad bold Lynx: ${line}`);
  }
  if (timeLimitSeconds !== null && Number.isNaN(timeLimitSeconds)) {
    throw new Error(`Bad time limit: ${line}`);
  }
  return {
    number: n,
    title,
    passwordMs,
    passwordLynx,
    timeLimitSeconds,
    boldTargetMs,
    boldTargetLynx,
  };
});

if (levels.length !== 149) {
  throw new Error(`Expected 149 levels, got ${levels.length}`);
}

const doc = {
  schemaVersion: 1,
  description:
    "Reference for original Chip's Challenge (MS Windows vs Lynx). timeLimitSeconds null = no limit (---). boldTargetLynx null = N/A.",
  levelCount: levels.length,
  levels,
};

fs.mkdirSync(path.dirname(outPath), { recursive: true });
fs.writeFileSync(outPath, `${JSON.stringify(doc, null, 2)}\n`, "utf8");
console.log("Wrote", outPath);
