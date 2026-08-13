/**
 * Game Codex — selftest.mjs
 *
 * C-05 compliant: Every claim has an executable check.
 * Zero dependencies, zero network, zero database.
 * Run: node selftest.mjs
 */

import { readFileSync, existsSync, readdirSync } from "fs";
import { execFileSync } from "child_process";
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

// PKO_PATH — точка входа страницы docs/index.html (var SRC), нужна отдельно
// для C-05 ниже, где сверяется побайтовая копия именно этой капсулы.
const PKO_PATH = join(__dirname, "knowledge/pko/chess-en-passant-001.pko.json");

// pkoDir/pkoFiles используются и здесь, и в C-06/C-08 ниже — объявлены один раз.
const pkoDir = join(__dirname, "knowledge/pko");
const pkoFiles = readdirSync(pkoDir).filter((f) => f.endsWith(".json"));

// ── C-02: every PKO atom is valid JSON with all required layers ──────────────
// До 12.08 здесь проверялась только chess-en-passant-001 — четвёртый за сутки
// случай дефекта «сторож смотрит только на первый объект» (см. C-06, C-08 ниже
// и запись в git log 2026-08-12 «слепое пятно закрыто»). Проверяются ВСЕ
// капсулы в knowledge/pko/, а не первая.
assert(pkoFiles.length > 0, "C-02 · at least one PKO exists in knowledge/pko/");

const REQUIRED_LAYERS = ["answer", "evidence", "model", "play", "quiz", "machine"];
for (const file of pkoFiles) {
  const path = join(pkoDir, file);
  let obj;
  try {
    obj = JSON.parse(readFileSync(path, "utf-8"));
    assert(true, `C-02 · [${file}] parses as valid JSON`);
  } catch (e) {
    assert(false, `C-02 · [${file}] parses as valid JSON (${e.message})`);
    continue;
  }

  const id = obj.id || file;

  for (const layer of REQUIRED_LAYERS) {
    assert(!!obj.layers?.[layer], `C-02 · [${id}] has layer "${layer}"`);
  }

  assert(!!obj.layers?.evidence?.ref,
    `C-02 · [${id}] evidence layer has a ref (not a bare claim)`);

  assert(!!obj.layers?.machine?.acceptance_sql || !!obj.layers?.machine?.local_check,
    `C-02 · [${id}] machine layer has at least one machine-checkable criterion`);

  assert(!!obj.layers?.machine?.local_check,
    `C-02 · [${id}] machine layer has a public local_check`);

  assert(typeof obj.confidence === "number",
    `C-02 · [${id}] confidence is a number (not absent or string)`);

  assert(!!obj.provenance?.claim?.source,
    `C-02 · [${id}] provenance.claim.source is present (knowledge has an author)`);
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
// pkoDir/pkoFiles объявлены выше, перед C-02, и переиспользуются здесь.
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
  assert(page.includes("this.dataset.square"),
    "C-05 · play click reads the clicked square, not a loop variable");
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

// ── C-07: one response contract, and a machine that catches a second one ──────
// Поймано 2026-08-12. Форма ответа была записана дважды: в промпте стерильного
// набора (`state_fen`, `explanation`) и в эвалюаторе (`moves`, `text`). Никто их
// не сравнивал. Модель выполнила тот контракт, который ей показали, и была
// опубликована с 18/36 вместо 36/36 — с объяснением, что это она не соблюла
// протокол. Тот же класс, что PULSE_DIR: два списка, ни одной машины между ними.
const contract = JSON.parse(readFileSync(join(__dirname, "docs/data/chess-response-contract-v0.1.json"), "utf8"));
const benchmark = JSON.parse(readFileSync(join(__dirname, "docs/data/chess-benchmark-v0.1.json"), "utf8"));

const families = [...new Set(benchmark.tasks.map((t) => t.family))];
for (const family of families) {
  assert(Array.isArray(contract.families?.[family]?.required),
    `C-07 · family "${family}" declares its required response fields in the contract`);
}

// Эталон обязан быть ровно тем, что производит генератор: правка руками означает,
// что форма ответа снова описана в двух местах.
const baselinePath = join(__dirname, "docs/data/chess-baseline-v0.1.json");
const baselineBefore = readFileSync(baselinePath, "utf8");
execFileSync(process.execPath, [join(__dirname, "scripts/make-baseline.mjs")], { stdio: "pipe" });
assert(readFileSync(baselinePath, "utf8") === baselineBefore,
  "C-07 · baseline is byte-identical to what make-baseline.mjs generates (not hand-edited)");

// Сквозная проверка: эталон, прогнанный через эвалюатор, обязан дать чистые 36/36
// без единого contract_violation. Расхождение имён полей падает именно здесь.
const evalOut = join(__dirname, "docs/data/chess-reference-result-v0.1.json");
execFileSync(process.execPath, [join(__dirname, "scripts/chess-evaluator.mjs"),
  "--input", baselinePath, "--output", evalOut], { stdio: "pipe" });
const refResult = JSON.parse(readFileSync(evalOut, "utf8"));
assert(refResult.metrics.contract_violations === 0,
  `C-07 · reference baseline produces 0 contract violations (got ${refResult.metrics.contract_violations})`);
assert(refResult.metrics.passed === benchmark.tasks.length * refResult.trials,
  `C-07 · reference baseline passes every fixture in every trial (${refResult.metrics.passed}/${benchmark.tasks.length * refResult.trials})`);
assert(refResult.response_contract === contract.contract,
  "C-07 · evaluator stamps the contract id it scored against into the result");

// ── C-08: every published capsule satisfies the Axioma-XKS spine ─────────────
// Спецификация без исполняемой проверки — это заявление, а не контракт, и первый
// же посторонний это увидит: в репозитории, чей принцип C-05 требует машинного
// критерия у каждого утверждения, документ без сторожа выглядит исключением,
// выписанным себе автором. Имена полей и словари читаются ИЗ СХЕМЫ, а не
// повторяются здесь — иначе появится второе описание формата, ровно тот дефект,
// за который уже дважды заплатили публично (см. C-07 и RESULTS.md).
//
// До 12.08 «C-08 ловит machine» означало «machine.local_check — непустая
// строка». Внешняя вычитка это назвала прямо: ридер может проверить НАЛИЧИЕ
// критерия, а не запустить его. С schema 1.2.0 (machine_execution_contract)
// это больше не так — ниже local_check реально ВЫПОЛНЯЕТСЯ (execFileSync,
// stdio: "pipe", таймаут), и код возврата решает GREEN/RED. Отсутствие
// local_check — тоже RED: контракт требует его у каждой капсулы, это не
// опциональное поле, о котором можно смолчать через SKIPPED.
const spine = JSON.parse(readFileSync(join(__dirname, "docs/data/axioma-xks-spine-v1.json"), "utf8"));

assert(existsSync(join(__dirname, "docs/AXIOMA-XKS.md")),
  "C-08 · the prose specification exists alongside its machine half");

for (const file of pkoFiles) {
  const obj = JSON.parse(readFileSync(join(pkoDir, file), "utf8"));
  const id = obj.id || file;

  const missingSpine = spine.spine.required.filter((f) => obj[f] === undefined || obj[f] === null);
  assert(missingSpine.length === 0,
    `C-08 · [${id}] carries every spine field${missingSpine.length ? ` (missing: ${missingSpine.join(", ")})` : ""}`);

  // Профиль берётся ИЗ КАПСУЛЫ, а не угадывается. До 12.08 здесь было жёстко
  // прописано "knowledge-object", то есть капсула-паспорт модуля проверялась бы
  // правилами объекта знания и прошла бы мимо своих собственных. Нашла это
  // холодная вычитка спецификации чужой моделью: поле `profile` в хребте
  // отсутствовало вовсе, и валидатор угадывал за автора.
  assert(!!spine.profiles[obj.profile],
    `C-08 · [${id}] declares a profile the spec knows (got ${JSON.stringify(obj.profile)})`);
  const profile = spine.profiles[obj.profile] || spine.profiles["knowledge-object"];
  const missingReq = profile.required.filter((f) => obj[f] === undefined || obj[f] === null);
  assert(missingReq.length === 0,
    `C-08 · [${id}] satisfies the knowledge-object profile${missingReq.length ? ` (missing: ${missingReq.join(", ")})` : ""}`);

  const missingLayers = profile.required_layers.filter((l) => !obj.layers?.[l]);
  assert(missingLayers.length === 0,
    `C-08 · [${id}] has all six mandatory layers${missingLayers.length ? ` (missing: ${missingLayers.join(", ")})` : ""}`);

  // machine.local_check не просто существует строкой — он ЗАПУСКАЕТСЯ, и код
  // возврата 0 — единственное, что здесь считается «утверждение держится».
  // До 12.08 здесь проверялось только наличие строки: спецификация обещала
  // исполняемый критерий, а сторож проверял текст промиса, а не сам промис.
  // Отсутствие local_check — RED, а не SKIPPED: контракт (machine_execution_contract,
  // schema 1.2.0) требует его у каждой капсулы профиля knowledge-object, поэтому
  // отсутствие — не «не проверено», а нарушение спецификации самой капсулой.
  const localCheck = obj.layers?.machine?.local_check;
  if (!localCheck || typeof localCheck !== "string") {
    assert(false, `C-08 · [${id}] machine.local_check is present (spec requires it, not optional)`);
  } else {
    const parts = localCheck.trim().split(/\s+/);
    const [cmd, ...args] = parts;
    try {
      execFileSync(cmd, args, { cwd: __dirname, stdio: "pipe", timeout: 30000 });
      assert(true, `C-08 · [${id}] local_check ("${localCheck}") exits 0 — claim still holds`);
    } catch (e) {
      const detail = e.status !== undefined ? `exit ${e.status}` : e.message;
      assert(false, `C-08 · [${id}] local_check ("${localCheck}") exits 0 — claim still holds (${detail})`);
    }
  }

  // acceptance_sql остаётся опциональным полем (внешний критерий, честно
  // помеченный как таковой) — его отсутствие не проваливает капсулу, но если
  // он есть, обязан быть непустой строкой, а не заглушкой.
  if (obj.layers?.machine?.acceptance_sql !== undefined) {
    assert(typeof obj.layers.machine.acceptance_sql === "string" && obj.layers.machine.acceptance_sql.trim().length > 0,
      `C-08 · [${id}] acceptance_sql, when present, is a non-empty string`);
  }

  // Заявленная уверенность — число в 0..1, а не строка и не подразумеваемая
  // читателем из уверенного тона. Ровно за это правило формат и держат.
  assert(typeof obj.confidence === "number" && obj.confidence >= 0 && obj.confidence <= 1,
    `C-08 · [${id}] declares confidence as a number in 0..1 (got ${JSON.stringify(obj.confidence)})`);

  // Подполя читаются из схемы, а не перечисляются здесь. До 12.08 этот тест
  // требовал `decay.check_after` и `decay.trigger`, которых схема не объявляла:
  // тест знал о формате больше, чем спецификация. Тот же дефект двух описаний,
  // от которого спецификация и написана, — найден внутри неё самой.
  for (const [field, spec] of Object.entries(spine.spine.substructure || {})) {
    const missing = (spec.required || []).filter((k) => !obj[field]?.[k]);
    assert(missing.length === 0,
      `C-08 · [${id}] ${field} carries its declared sub-fields${missing.length ? ` (missing: ${missing.join(", ")})` : ""}`);
  }

  // Словари с 1.3.0 принадлежат ПРОФИЛЮ, а не формату: `layer` у паспорта модуля
  // и у корпуса знаний — разные словари, и это не придирка, а причина, по которой
  // соседний корпус стоял заблокированным с 02.08.
  //
  // Проверка обходит все словари, объявленные для профиля капсулы, плюс общие.
  // Раньше здесь читалось `spine.vocabularies.lifecycle` — путь, которого после
  // 1.3.0 не существует. Прогон при этом остался зелёным, потому что ни у одной
  // капсулы нет поля `lifecycle`: ветка просто не исполнялась. Сторож был мёртвым
  // кодом, который упал бы на первой же капсуле с этим полем. Тот же класс, что
  // «сторож смотрит только на первый объект», только злее — здесь он не смотрел
  // ни на один и всё равно докладывал зелёным.
  const vocabs = {
    ...(spine.vocabularies.shared || {}),
    ...((spine.vocabularies.by_profile || {})[obj.profile] || {}),
  };
  for (const [name, allowed] of Object.entries(vocabs)) {
    if (!Array.isArray(allowed)) continue;           // `note` и прочая проза — не словарь
    const declared = obj[`${name}_profile`];
    if (declared !== undefined) {
      // Правило расширения: незнакомый профиль словаря — это «не знаю», а не «невалидна».
      skip(`C-08 · [${id}] ${name} vocabulary (declared profile "${declared}")`,
        "капсула объявила чужой профиль словаря — по правилу расширения это «не знаю», а не провал");
    } else if (obj[name] !== undefined) {
      assert(allowed.includes(obj[name]),
        `C-08 · [${id}] ${name} "${obj[name]}" is inside the closed vocabulary of profile "${obj.profile}"`);
    }
  }
}

// ── Print results ─────────────────────────────────────────────────────────────
const LABEL = { pass: "GREEN  ", fail: "RED    ", skip: "SKIPPED" };
for (const r of results) {
  const suffix = r.status === "skip" ? ` (${r.reason})` : "";
  console.log(`  ${LABEL[r.status]} ${r.desc}${suffix}`);
}

console.log(`\nclaims: ${new Set(results.map(r=>r.desc.slice(0,4))).size} · assertions passed: ${passed} · failed: ${failed} · skipped: ${skipped}\n`);

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
