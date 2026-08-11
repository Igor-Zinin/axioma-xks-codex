/**
 * Game Codex — selftest.mjs
 *
 * C-05 compliant: Every claim has an executable check.
 * Zero dependencies, zero network, zero database.
 * Run: node selftest.mjs
 */

import { readFileSync, existsSync, readdirSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import { runAudit } from "./packages/auditor/auditor.mjs";


const __dirname = dirname(fileURLToPath(import.meta.url));

let passed = 0;
let failed = 0;
let skipped = 0;
const results = [];

function assert(condition, description) {
  if (condition) {
    passed++;
    results.push({ status: "pass", desc: description });
  } else {
    failed++;
    results.push({ status: "fail", desc: description });
  }
}

// skip(): для проверок, которые не выполнялись (сеть недоступна или явно
// пропущена флагом). Это НЕ "прошло" — прогон с хотя бы одним skip не зелёный,
// а неполный, и это обязано быть видно в выводе и в коде возврата.
function skip(description, reason) {
  skipped++;
  results.push({ status: "skip", desc: description, reason });
}

console.log("\nGame Codex · selftest\n");

/**
 * normalizeForSearch: приводит текст к форме, устойчивой к переносам строк,
 * неразрывным пробелам и различиям в кавычках, чтобы искать подстроку
 * честно, а не только "текст присутствует в разметке буква в букву".
 */
function normalizeForSearch(text) {
  return text
    .replace(/<[^>]*>/g, " ")
    .replace(/\b\d+(?:\.\d+){2,}\b/g, " ")
    .replace(/ /g, " ")
    .replace(/[‘’]/g, "'")
    .replace(/[“”]/g, '"')
    .replace(/\s+/g, " ")
    .trim();
}

// ── C-01: monorepo structure exists ──────────────────────────────────────────
assert(existsSync(join(__dirname, "packages/auditor/auditor.mjs")),
  "C-01 · packages/auditor/auditor.mjs exists (Auditor Layer)");

assert(typeof runAudit === "function",
  "C-01 · auditor module actually loads and exports runAudit (not just a file on disk)");

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

// ── C-06: evidence ref actually resolves and the quote is really there ───────
// C-02 only checked that evidence.ref is a non-empty string. That let a dead
// link (2009 PDF cited as "2023") ship green.
//
// Правило (канон AGENTS.md, правило 18): сетевые вызовы разрешены только для
// evidence.ref. Недоступность сети ИЛИ явный флаг пропуска (SKIP_NETWORK=1)
// дают статус SKIPPED ("не проверено"), а не PASSED. Прогон с хотя бы одним
// SKIPPED — не зелёный, а неполный: это видно в итоговой строке и в коде
// возврата (см. низ файла). SKIPPED — это не RED: RED зарезервирован для
// случая, когда сеть доступна и реально показала, что evidence сломан
// (плохой HTTP-статус или цитата не найдена в теле ответа).
// ПРОВЕРЯЮТСЯ ВСЕ ОБЪЕКТЫ, А НЕ ПЕРВЫЙ. Поймано 2026-08-12: C-06 смотрел один
// PKO, в репозиторий добавили второй (concept-ccp-001) со ссылкой на файл, которого
// на GitHub нет — вики живёт отдельным репозиторием, а не веткой main. Прогон
// остался зелёным: 30 проверок, 0 пропущенных, при битой ссылке в публичном объекте.
// Сторож, покрывающий не всё, молчит именно там, где должен кричать — тот же класс,
// что и §8 «проверяй соседей, а не только цель правки».
const pkoDir = join(__dirname, "knowledge/pko");
const pkoFiles = readdirSync(pkoDir).filter((f) => f.endsWith(".json"));
assert(pkoFiles.length > 0, "C-06 · at least one PKO exists to be checked");

for (const file of pkoFiles) {
  const obj = JSON.parse(readFileSync(join(pkoDir, file), "utf8"));
  const id = obj.id || file;
  const ref = obj?.layers?.evidence?.ref;
  const quote = obj?.layers?.evidence?.quote;

  if (!ref) {
    assert(false, `C-06 · [${id}] evidence.ref exists so reachability can be checked`);
    continue;
  }

  if (process.env.SKIP_NETWORK === "1") {
    skip(`C-06 · [${id}] evidence.ref reachability (${ref})`,
      "SKIP_NETWORK=1 — сетевая проверка явно пропущена, не подтверждена");
    continue;
  }

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);
    const res = await fetch(ref, { signal: controller.signal });
    clearTimeout(timeout);

    assert(res.ok,
      `C-06 · [${id}] evidence.ref resolves with HTTP 2xx (got ${res.status}) — ${ref}`);

    if (res.ok && quote) {
      const body = await res.text();
      const found = normalizeForSearch(body).includes(normalizeForSearch(quote));
      assert(found,
        `C-06 · [${id}] evidence.quote is found verbatim (whitespace-normalized) in the fetched source`);
    } else if (!quote) {
      assert(false, `C-06 · [${id}] evidence.quote is present so it can be checked against the source`);
    }
  } catch (e) {
    // Сеть недоступна (DNS/timeout/abort/fetch failed) — не значит, что
    // evidence сломан. Это "не проверено", а не провал проверки.
    skip(`C-06 · [${id}] evidence.ref reachability (${ref})`,
      `сеть недоступна: ${e.message}`);
  }
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

// ── C-05: public page shows the PKO and does not fork the data ───────────────
// docs/ отдаётся GitHub Pages как статика. Страница читает PKO из docs/data/,
// поэтому копия обязана быть побайтово равна канону в knowledge/pko/.
// Расхождение = второй источник правды и ловится здесь.
const PAGE_PATH = join(__dirname, "docs/index.html");
assert(existsSync(PAGE_PATH), "C-05 · docs/index.html exists (public page)");
assert(existsSync(join(__dirname, "docs/style.css")), "C-05 · docs/style.css exists");

if (existsSync(PAGE_PATH)) {
  const page = readFileSync(PAGE_PATH, "utf-8");
  assert(page.includes('id="play-status"'),
    "C-05 · play layer exposes an accessible live status");
  assert(page.includes('addEventListener("click"'),
    "C-05 · play layer handles square clicks");
  assert(page.includes("success_fen"),
    "C-05 · play layer updates the position after a correct move");
  assert(page.includes('fetch(SRC'),
    "C-05 · page reads the PKO at runtime (data is fetched, not retyped into HTML)");

  const srcMatch = page.match(/var SRC = "([^"]+)"/);
  assert(!!srcMatch, "C-05 · page declares the PKO path it fetches");

  if (srcMatch) {
    const docsCopy = join(__dirname, "docs", srcMatch[1]);
    assert(existsSync(docsCopy),
      `C-05 · fetched file exists on disk (docs/${srcMatch[1]})`);

    if (existsSync(docsCopy)) {
      const canon = readFileSync(PKO_PATH);
      const copy = readFileSync(docsCopy);
      assert(canon.equals(copy),
        "C-05 · docs/data copy is byte-identical to knowledge/pko canon (run: node scripts/sync-docs.mjs)");
    }
  }

  assert(!/https?:\/\/(cdn|unpkg|cdnjs|fonts)\./.test(page),
    "C-05 · page has no CDN or web-font dependency (opens offline)");
}

// ── Print results ─────────────────────────────────────────────────────────────
const LABEL = { pass: "GREEN  ", fail: "RED    ", skip: "SKIPPED" };
for (const r of results) {
  const suffix = r.status === "skip" ? ` (${r.reason})` : "";
  console.log(`  ${LABEL[r.status]} ${r.desc}${suffix}`);
}

console.log(`\nclaims: 5 · assertions passed: ${passed} · failed: ${failed} · skipped: ${skipped}\n`);

// process.exitCode (not process.exit()) — an abrupt exit() while the fetch
// dispatcher in C-06 still has a keep-alive socket/timer open crashes on
// Windows (libuv "UV_HANDLE_CLOSING" assertion). Setting exitCode lets the
// event loop drain those handles on its own before the process exits.
//
// Три состояния, три кода возврата. Молчаливый ноль при пропусках недопустим:
// прогон, где хоть одна проверка не выполнялась, не может выглядеть так же,
// как прогон, где всё реально проверено и зелено. 0 = всё проверено и
// прошло. 1 = есть реальный провал (RED) — это старше пропуска, потому что
// подтверждённая поломка важнее неподтверждённости. 2 = провалов нет, но
// есть пропуски (SKIPPED) — прогон неполный, его нельзя засчитывать как
// зелёный ни человеку, ни CI-гейту.
if (failed > 0) {
  console.log("🔴 selftest FAILED\n");
  process.exitCode = 1;
} else if (skipped > 0) {
  console.log(`🟡 selftest INCOMPLETE — ${skipped} check(s) skipped, not verified (see SKIPPED lines above)\n`);
  process.exitCode = 2;
} else {
  console.log("✅ The structure matches the claims. Every layer exists.\n");
  process.exitCode = 0;
}
