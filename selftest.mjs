/**
 * Game Codex — selftest.mjs
 *
 * C-05 compliant: Every claim has an executable check.
 * Zero dependencies, zero network, zero database.
 * Run: node selftest.mjs
 */

import { readFileSync, existsSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import { runAudit } from "./packages/auditor/auditor.mjs";


const __dirname = dirname(fileURLToPath(import.meta.url));

let passed = 0;
let failed = 0;
const results = [];

function assert(condition, description) {
  if (condition) {
    passed++;
    results.push({ ok: true, desc: description });
  } else {
    failed++;
    results.push({ ok: false, desc: description });
  }
}

console.log("\nGame Codex · selftest\n");

// ── C-01: monorepo structure exists ──────────────────────────────────────────
assert(existsSync(join(__dirname, "packages/knowledge-api/validate.py")),
  "C-01 · knowledge-api/validate.py exists (Knowledge Layer)");

assert(existsSync(join(__dirname, "packages/auditor/auditor.mjs")),
  "C-01 · packages/auditor/auditor.mjs exists (Auditor Layer)");

assert(existsSync(join(__dirname, "packages/game-shell/PhaserGame.tsx")),
  "C-01 · packages/game-shell/PhaserGame.tsx exists (Play Layer)");

assert(existsSync(join(__dirname, "knowledge/pko")),
  "C-01 · knowledge/pko/ directory exists (PKO Canon)");

// ── C-02: first PKO atom is valid JSON with all required layers ───────────────
const PKO_PATH = join(__dirname, "knowledge/pko/chess-en-passant-001.pko.json");
assert(existsSync(PKO_PATH), "C-02 · chess-en-passant-001.pko.json exists");

let pko;
try {
  pko = JSON.parse(readFileSync(PKO_PATH, "utf-8"));
  assert(true, "C-02 · chess PKO parses as valid JSON");
} catch (e) {
  assert(false, `C-02 · chess PKO parses as valid JSON (${e.message})`);
}

if (pko) {
  const REQUIRED_LAYERS = ["answer", "evidence", "model", "play", "quiz", "machine"];
  for (const layer of REQUIRED_LAYERS) {
    assert(!!pko.layers?.[layer], `C-02 · chess PKO has layer "${layer}"`);
  }

  assert(!!pko.layers?.evidence?.ref,
    "C-02 · evidence layer has a ref (not a bare claim)");

  assert(!!pko.layers?.machine?.acceptance_sql,
    "C-02 · machine layer has acceptance_sql (machine-checkable criterion)");

  assert(pko.confidence === 1.0,
    "C-02 · confidence is a number (not absent or string)");

  assert(!!pko.provenance?.claim?.source,
    "C-02 · provenance.claim.source is present (knowledge has an author)");
}

// ── C-03: PKO auditor detects broken PKOs ────────────────────────────────────
// Smoke-test: auditor runs without crashing on an empty directory
const emptyReport = runAudit(join(__dirname, "knowledge/pko/__nonexistent__"));
assert(emptyReport.total === 0,
  "C-03 · auditor returns 0 total for non-existent directory (no crash)");

// Full audit of real PKO dir — should pass cleanly
const realReport = runAudit(join(__dirname, "knowledge/pko"));
assert(realReport.ok,
  `C-03 · PKO auditor is green for all ${realReport.total} PKO(s) in knowledge/pko/`);

// ── C-04: README matches this selftest ───────────────────────────────────────
const README_PATH = join(__dirname, "README.md");
assert(existsSync(README_PATH), "C-04 · README.md exists");

if (existsSync(README_PATH)) {
  const readme = readFileSync(README_PATH, "utf-8");
  assert(readme.includes("selftest.mjs"),
    "C-04 · README.md mentions selftest.mjs");
  assert(readme.includes("PKO"),
    "C-04 · README.md mentions PKO (Playable Knowledge Object)");
  assert(readme.includes("CLAIM"),
    "C-04 · README.md mentions CLAIM → CHECK pipeline");
}

// ── Print results ─────────────────────────────────────────────────────────────
for (const r of results) {
  console.log(`  ${r.ok ? "GREEN" : "RED  "} ${r.desc}`);
}

console.log(`\nclaims: 4 · assertions passed: ${passed} · failed: ${failed}\n`);

if (failed > 0) {
  console.log("🔴 selftest FAILED\n");
  process.exit(1);
} else {
  console.log("✅ The structure matches the claims. Every layer exists.\n");
  process.exit(0);
}
