#!/usr/bin/env node
/**
 * Deterministic Chess v0.1 evaluator.
 * It evaluates submitted trajectories; it never calls a model or invents a run.
 */
import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const protocolPath = path.join(root, "docs", "data", "chess-benchmark-v0.1.json");
const inputArg = process.argv.indexOf("--input");
const inputPath = inputArg >= 0 ? process.argv[inputArg + 1] : null;
const outputArg = process.argv.indexOf("--output");
const outputPath = outputArg >= 0 ? process.argv[outputArg + 1] : null;
if (!inputPath) {
  console.error("Usage: node scripts/chess-evaluator.mjs --input <submission.json>");
  process.exit(2);
}

const protocol = JSON.parse(fs.readFileSync(protocolPath, "utf8"));
const submission = JSON.parse(fs.readFileSync(path.resolve(inputPath), "utf8"));
const trials = Array.isArray(submission.trials) ? submission.trials : [];
const verdicts = [];

function normalize(text) {
  return String(text || "").toLowerCase().replace(/[’']/g, "'");
}

function applyEnPassant(fen, move) {
  if (move !== "e5d6") return null;
  const fields = fen.split(" ");
  if (fields[0] !== "8/8/8/3pP3/8/8/8/8" || fields[1] !== "w" || fields[2] !== "-" || fields[3] !== "d6") return null;
  fields[0] = "8/8/3P4/8/8/8/8/8";
  fields[3] = "-";
  return fields.join(" ");
}

function evaluate(task, response) {
  if (!response) return { status: "incomplete", reason: "missing response" };
  if (task.family === "legality") return response.move === task.expected.move
    ? { status: "pass" } : { status: "fail", reason: "move is not the expected legal move" };
  if (task.family === "tactics") return response.move === task.expected.best_move
    ? { status: "pass" } : { status: "fail", reason: "move is not the expected tactical solution" };
  if (task.family === "state_tracking") {
    const moves = response.moves;
    return Array.isArray(moves) && moves.length === 1 && applyEnPassant(task.start_fen, moves[0]) === task.expected_fen
      ? { status: "pass" } : { status: "fail", reason: "state transition does not match expected FEN" };
  }
  if (task.family === "interactive_play") {
    const moves = response.moves;
    return Array.isArray(moves) && moves.join(",") === task.expected_moves.join(",") && applyEnPassant(task.start_fen, moves[0]) === task.expected_fen
      ? { status: "pass" } : { status: "fail", reason: "interactive trajectory is illegal or incomplete" };
  }
  if (task.family === "explanation") {
    const text = normalize(response.text);
    const hasRequired = task.required_concepts.every((concept) => text.includes(normalize(concept)) || (concept === "next" && text.includes("след")));
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
const passed = verdicts.filter((v) => v.status === "pass").length;
const failed = verdicts.filter((v) => v.status === "fail").length;
const incomplete = verdicts.filter((v) => v.status === "incomplete").length;
const taskCount = protocol.tasks.length;
const consistency = trials.length ? protocol.tasks.filter((task) => trials.every((_, i) => verdicts.find((v) => v.trial === i + 1 && v.task === task.id)?.status === "pass")).length / taskCount : 0;
const result = {
  game: submission.game || protocol.game,
  protocol: submission.protocol || protocol.protocol,
  model: submission.model || "unspecified",
  provider: submission.provider || "unspecified",
  trials: trials.length,
  metrics: { pass_rate: total ? passed / total : 0, consistency, passed, failed, incomplete },
  verdicts,
  evidence_status: "submitted"
};
console.log(JSON.stringify(result, null, 2));
if (outputPath) fs.writeFileSync(path.resolve(outputPath), `${JSON.stringify(result, null, 2)}\n`);
if (!trials.length || failed > 0 || incomplete > 0) process.exitCode = 1;
