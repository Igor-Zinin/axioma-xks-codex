/**
 * Game Codex — PKO (Playable Knowledge Object) Auditor
 *
 * Проверяет, что каждый PKO-атом в knowledge/pko/ содержит все
 * обязательные слои: answer, evidence, model, play, quiz, machine.
 *
 * ADOPT из Igor-Zinin/DaemonTycoon src/js/auditor.js
 * Переработано: убрана Firebase/Telegram зависимость.
 * Добавлено: PKO-schema validation, coverage report.
 *
 * Zero dependencies — только Node 18+ built-ins.
 */

import { readFileSync, readdirSync, statSync } from "fs";
import { join, extname } from "path";
import { fileURLToPath } from "url";
import { dirname } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const PKO_DIR = join(__dirname, "../../knowledge/pko");

// Обязательные слои каждого PKO
const REQUIRED_LAYERS = ["answer", "evidence", "model", "play", "quiz", "machine"];

// Обязательные поля корневого уровня PKO
const REQUIRED_ROOT_FIELDS = ["id", "xks_version", "claim", "game", "layers"];

class AuditReport {
  constructor() {
    this.errors = [];
    this.warnings = [];
    this.passed = 0;
    this.total = 0;
  }

  fail(where, msg) {
    this.errors.push(`[${where}] ${msg}`);
  }

  warn(where, msg) {
    this.warnings.push(`[${where}] ${msg}`);
  }

  get ok() {
    return this.errors.length === 0;
  }
}

function findPKOs(dir) {
  const found = [];
  try {
    for (const entry of readdirSync(dir)) {
      const full = join(dir, entry);
      if (statSync(full).isDirectory()) {
        found.push(...findPKOs(full));
      } else if (extname(entry) === ".json" && entry.endsWith(".pko.json")) {
        found.push(full);
      }
    }
  } catch {
    // directory may not exist yet
  }
  return found;
}

function auditPKO(filePath, report) {
  const rel = filePath.replace(PKO_DIR, "").replace(/\\/g, "/");
  report.total++;

  let pko;
  try {
    pko = JSON.parse(readFileSync(filePath, "utf-8"));
  } catch (e) {
    report.fail(rel, `не разбирается как JSON: ${e.message}`);
    return;
  }

  // Проверка обязательных полей
  for (const field of REQUIRED_ROOT_FIELDS) {
    if (!pko[field]) {
      report.fail(rel, `отсутствует обязательное поле "${field}"`);
    }
  }

  // Проверка версии
  if (pko.xks_version && pko.xks_version !== "1.0") {
    report.warn(rel, `xks_version="${pko.xks_version}" — ожидается "1.0"`);
  }

  // Проверка слоёв
  const layers = pko.layers || {};
  for (const layer of REQUIRED_LAYERS) {
    if (!layers[layer]) {
      report.fail(rel, `отсутствует слой "${layer}"`);
    }
  }

  // Проверка Evidence: должна быть ссылка или путь
  const evidence = layers.evidence;
  if (evidence && !evidence.ref && !evidence.sql && !evidence.script) {
    report.fail(rel, `evidence не содержит ни ref, ни sql, ни script — это заявление без доказательства`);
  }

  // Проверка Machine: обязан быть acceptance_sql (интеграция с kernel 00)
  const machine = layers.machine;
  if (machine && !machine.acceptance_sql) {
    report.fail(rel, `layers.machine.acceptance_sql отсутствует — нет машинного критерия приёмки`);
  }

  if (report.errors.filter(e => e.startsWith(`[${rel}]`)).length === 0) {
    report.passed++;
  }
}

export function runAudit(pkoDir = PKO_DIR) {
  const report = new AuditReport();
  const files = findPKOs(pkoDir);

  for (const f of files) {
    auditPKO(f, report);
  }

  return report;
}

// --- CLI entry point ---
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  console.log("\nGame Codex · PKO Auditor\n");

  const report = runAudit();

  for (const e of report.errors) console.log(`  ❌ ${e}`);
  for (const w of report.warnings) console.log(`  ⚠️  ${w}`);

  const summary = `PKO проверено: ${report.total}, прошло: ${report.passed}, ошибок: ${report.errors.length}`;

  if (report.ok) {
    console.log(`\n✅ ${summary}\n`);
    process.exit(0);
  } else {
    console.log(`\n🔴 ${summary}\n`);
    process.exit(1);
  }
}
