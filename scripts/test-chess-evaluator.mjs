#!/usr/bin/env node
/** Contract test for the evaluator: a good fixture passes and a bad one fails. */
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const evaluator = path.join(root, "scripts", "chess-evaluator.mjs");
const baseline = path.join(root, "docs", "data", "chess-baseline-v0.1.json");
const temp = path.join(os.tmpdir(), `game-codex-chess-negative-${process.pid}.json`);
const bad = JSON.parse(fs.readFileSync(baseline, "utf8"));
bad.trials[0].responses["legality-001"].move = "e5e6";
fs.writeFileSync(temp, JSON.stringify(bad));
try {
  const good = spawnSync(process.execPath, [evaluator, "--input", baseline], { encoding: "utf8" });
  assert.equal(good.status, 0, "reference baseline must pass");
  const rejected = spawnSync(process.execPath, [evaluator, "--input", temp], { encoding: "utf8" });
  assert.notEqual(rejected.status, 0, "known-bad submission must be rejected");
  console.log("GREEN chess-evaluator-contract: accepts baseline and rejects illegal move");
} finally {
  fs.rmSync(temp, { force: true });
}
