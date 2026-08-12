#!/usr/bin/env node
/**
 * Deterministic Chess v0.1 evaluator.
 * It evaluates submitted trajectories; it never calls a model or invents a run.
 *
 * v0.2.0 (2026-08-12) — the field names are no longer written here. They are read
 * from docs/data/chess-response-contract-v0.1.json, which is also the file the
 * submitter's prompt is written from. Why this matters: v0.1.0 hard-coded `moves`
 * and `text`, while the prompt handed to the first evaluated model asked for
 * `state_fen` and `explanation`. Two statements of one contract, nothing comparing
 * them — a model that complied perfectly was published at 18/36 instead of 36/36,
 * with the failure attributed to the model. One list, or a machine that catches
 * the second one diverging.
 *
 * Also removed in v0.2.0: `applyKnownMove`, a two-entry lookup table over the two
 * en-passant positions that re-derived the board itself and compared the model's
 * echo of the input move list. State tracking now compares the model's own FEN to
 * the expected FEN — the thing the family claims to measure.
 */
import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const protocolPath = path.join(root, "docs", "data", "chess-benchmark-v0.1.json");
const contractPath = path.join(root, "docs", "data", "chess-response-contract-v0.1.json");
const inputArg = process.argv.indexOf("--input");
const inputPath = inputArg >= 0 ? process.argv[inputArg + 1] : null;
const outputArg = process.argv.indexOf("--output");
const outputPath = outputArg >= 0 ? process.argv[outputArg + 1] : null;
if (!inputPath) {
  console.error("Usage: node scripts/chess-evaluator.mjs --input <submission.json>");
  process.exit(2);
}

const protocol = JSON.parse(fs.readFileSync(protocolPath, "utf8"));
const contract = JSON.parse(fs.readFileSync(contractPath, "utf8"));
const submission = JSON.parse(fs.readFileSync(path.resolve(inputPath), "utf8"));
const trials = Array.isArray(submission.trials) ? submission.trials : [];
const evaluatorVersion = "chess-evaluator@0.2.0";
const verdicts = [];

function normalize(text) {
  return String(text || "").toLowerCase().replace(/[’']/g, "'");
}

/**
 * The shape check runs before the answer check, so "wrong" and "not in the agreed
 * shape" can never be reported as the same thing again.
 */
function checkContract(family, response) {
  const required = contract.families[family]?.required || [];
  const missing = required.filter((f) => response[f] === undefined || response[f] === null);
  return missing.length ? missing : null;
}

function evaluate(task, response) {
  if (!response) return { status: "incomplete", reason: "no response for this fixture" };
  if (response.completed === false) return { status: "incomplete", reason: "model declared the task incomplete" };

  const missing = checkContract(task.family, response);
  if (missing) return { status: "contract_violation", reason: `required field(s) absent or null: ${missing.join(", ")}` };

  if (task.family === "legality") return response.move === task.expected.move && response.legal === task.expected.legal
    ? { status: "pass" } : { status: "fail", reason: "move is not the expected legal move" };

  if (task.family === "tactics") return response.move === task.expected.best_move
    ? { status: "pass" } : { status: "fail", reason: "move is not the expected tactical solution" };

  if (task.family === "state_tracking") return response.state_fen === task.expected_fen
    ? { status: "pass" } : { status: "fail", reason: "reconstructed FEN does not match the expected position" };

  if (task.family === "interactive_play") return response.move === task.expected_moves[0] && response.state_fen === task.expected_fen
    ? { status: "pass" } : { status: "fail", reason: "trajectory or resulting position is wrong" };

  if (task.family === "explanation") {
    const text = normalize(response.explanation);
    const hasRequired = task.required_concepts.every((concept) => text.includes(normalize(concept)));
    const hasForbidden = task.forbidden_concepts.some((concept) => text.includes(normalize(concept)));
    return hasRequired && !hasForbidden ? { status: "pass" } : { status: "fail", reason: "explanation is not grounded in the verified rule" };
  }

  return { status: "incomplete", reason: `unsupported task family ${task.family}` };
}

for (let trialIndex = 0; trialIndex < trials.length; trialIndex += 1) {
  const responses = trials[trialIndex]?.responses || {};
  for (const task of protocol.tasks) verdicts.push({ trial: trialIndex + 1, task: task.id, family: task.family, ...evaluate(task, responses[task.id]) });
}

const total = verdicts.length;
const count = (s) => verdicts.filter((v) => v.status === s).length;
const passed = count("pass");
const failed = count("fail");
const incomplete = count("incomplete");
const contractViolations = count("contract_violation");
const taskCount = protocol.tasks.length;
const consistency = trials.length ? protocol.tasks.filter((task) => trials.every((_, i) => verdicts.find((v) => v.trial === i + 1 && v.task === task.id)?.status === "pass")).length / taskCount : 0;

const families = {};
for (const v of verdicts) {
  families[v.family] = families[v.family] || { passed: 0, total: 0 };
  families[v.family].total += 1;
  if (v.status === "pass") families[v.family].passed += 1;
}

const result = {
  game: submission.game || protocol.game,
  protocol: submission.protocol || protocol.protocol,
  model: submission.model || "unspecified",
  provider: submission.provider || "unspecified",
  date: submission.date || null,
  evaluator_version: evaluatorVersion,
  response_contract: contract.contract,
  trials: trials.length,
  metrics: { pass_rate: total ? passed / total : 0, consistency, passed, failed, contract_violations: contractViolations, incomplete },
  family_profile: families,
  verdicts,
  raw_trajectories: trials,
  evidence_status: "submitted"
};
console.log(JSON.stringify(result, null, 2));
if (outputPath) fs.writeFileSync(path.resolve(outputPath), `${JSON.stringify(result, null, 2)}\n`);
if (!trials.length || failed > 0 || incomplete > 0 || contractViolations > 0) process.exitCode = 1;
