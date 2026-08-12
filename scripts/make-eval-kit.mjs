#!/usr/bin/env node
/**
 * Builds the sterile evaluation kit handed to an evaluated model.
 *
 * The prompt is GENERATED from docs/data/chess-response-contract-v0.1.json, never
 * written by hand. On 2026-08-12 the kit's prompt and the evaluator each stated the
 * response shape independently, they disagreed, and a fully compliant model was
 * published at half its score with the failure attributed to the model. A kit that
 * is typed rather than generated re-opens exactly that hole.
 *
 * Run: node scripts/make-eval-kit.mjs --model <name> --out <dir>
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const arg = (n, d) => { const i = process.argv.indexOf(n); return i >= 0 ? process.argv[i + 1] : d; };
const modelSlug = arg("--model", "model");
const outDir = path.resolve(arg("--out", path.join(root, "eval-kit")));

const contract = JSON.parse(fs.readFileSync(path.join(root, "docs/data/chess-response-contract-v0.1.json"), "utf8"));
const protocol = JSON.parse(fs.readFileSync(path.join(root, "docs/data/chess-benchmark-v0.1.json"), "utf8"));

const fieldLines = Object.entries(contract.response_object.fields)
  .map(([name, desc]) => `- \`${name}\` — ${desc}`).join("\n");
const familyLines = Object.entries(contract.families)
  .map(([f, spec]) => `| \`${f}\` | ${spec.required.map((r) => `\`${r}\``).join(", ")} |`).join("\n");
const exampleObject = Object.fromEntries(Object.keys(contract.response_object.fields).map((f) =>
  [f, f === "move" ? "e5d6" : f === "legal" ? true : f === "completed" ? true : null]));

const prompt = `# Evaluation prompt — Game Codex Chess v0.1

Generated from \`${contract.contract}\` by scripts/make-eval-kit.mjs. Do not edit by hand:
this file and the evaluator are two faces of one contract, and hand-editing one of them is
the defect this kit exists to prevent.

You are conducting a blinded external model evaluation for Game Codex Chess v0.1.
You are the evaluated model, not the evaluator.

## Rules

- Use only the benchmark text supplied in \`benchmark.json\`.
- Assume this evaluation folder is the complete world available to you.
- Do not use web search, external repositories, or external tools.
- Do not inspect or run an evaluator.
- Do not ask another model for the answer.
- Do not repair, normalize, or reinterpret your own output after producing it.
- If a task cannot be completed, set \`completed: false\`. Never guess that it passed.

## Run protocol

Run exactly three independent trials. Each trial uses a fresh context and must not see
another trial's output. Save each complete raw response, unedited, as:

\`results/${modelSlug}-trial-01.json\`
\`results/${modelSlug}-trial-02.json\`
\`results/${modelSlug}-trial-03.json\`

Do not put a score in the files. The external evaluator calculates it later.

**Record the wall-clock start and end time of every trial, in UTC, in \`run-log.json\`.**
The first run of this benchmark did not, and its result carries a technical \`00:00Z\`
that cannot be repaired after the fact.

## Required response shape

One JSON object per trial. Every fixture id from \`benchmark.json\` appears exactly once,
and every response object carries every field below — use \`null\` where a field does not
apply to that fixture. Do not omit fields and do not invent new ones.

${fieldLines}

\`\`\`json
{
  "model": "${modelSlug}",
  "trial": 1,
  "responses": {
    "${protocol.tasks[0].id}": ${JSON.stringify(exampleObject)}
  }
}
\`\`\`

Which fields are scored for which task family:

| family | scored fields |
|---|---|
${familyLines}

A required field left \`null\` while \`completed\` is \`true\` is recorded as
\`contract_violation\` — answered, but not in the agreed shape. It is reported separately
from a wrong answer, so the two can never again be confused for each other.
`;

const runLog = {
  note: "Fill one entry per trial. UTC, ISO-8601, seconds precision. Do not back-date a guess: leave a field empty and say so rather than inventing a time.",
  model_snapshot: "",
  provider: "",
  timezone: "",
  tools_allowed: [],
  internet_allowed: false,
  private_repository_access: false,
  trials: [1, 2, 3].map((n) => ({ trial: n, started_utc: "", ended_utc: "", fresh_context: true, notes: "" }))
};

fs.mkdirSync(path.join(outDir, "results"), { recursive: true });
fs.writeFileSync(path.join(outDir, "PROMPT.md"), prompt);
fs.writeFileSync(path.join(outDir, "benchmark.json"), fs.readFileSync(path.join(root, "docs/data/chess-benchmark-v0.1.json")));
fs.writeFileSync(path.join(outDir, "run-log.json"), `${JSON.stringify(runLog, null, 2)}\n`);
console.log(`kit written to ${outDir} — prompt generated from ${contract.contract}, ${protocol.tasks.length} fixtures`);
