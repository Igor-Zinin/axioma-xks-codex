/**
 * Game Codex — scripts/check-concept-ccp.mjs
 *
 * local_check for knowledge/pko/concept-ccp-001.pko.json.
 *
 * Утверждение капсулы: PKO — это шестислойный объект (Answer, Evidence,
 * Model, Play, Quiz, Machine). До 12.08 у этой капсулы не было local_check
 * вовсе, только acceptance_sql — запрос к BigQuery, к которому у постороннего
 * доступа нет. Публичной проверки утверждения не существовало.
 *
 * Этот скрипт проверяет утверждение буквально: читает список обязательных
 * слоёв профиля knowledge-object ИЗ СХЕМЫ (docs/data/axioma-xks-spine-v1.json),
 * а не повторяет его здесь, и удостоверяется, что у каждой капсулы профиля
 * knowledge-object в knowledge/pko/ объявлены все шесть слоёв. Если схема
 * когда-нибудь объявит другое число слоёв, этот скрипт проверит именно его,
 * а не число "6", зашитое как магическая константа.
 *
 * Zero dependencies, zero network. Exit 0 = claim holds. Exit 1 = it does not.
 */

import { readFileSync, readdirSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const PKO_DIR = join(ROOT, "knowledge", "pko");
const SPINE_PATH = join(ROOT, "docs", "data", "axioma-xks-spine-v1.json");
const CAPSULE_PATH = join(PKO_DIR, "concept-ccp-001.pko.json");

let failed = false;
function fail(msg) {
  failed = true;
  console.error(`RED · ${msg}`);
}

let spine;
try {
  spine = JSON.parse(readFileSync(SPINE_PATH, "utf8"));
} catch (e) {
  fail(`схема не читается: ${e.message}`);
  process.exit(1);
}

let capsule;
try {
  capsule = JSON.parse(readFileSync(CAPSULE_PATH, "utf8"));
} catch (e) {
  fail(`капсула concept-ccp-001 не читается: ${e.message}`);
  process.exit(1);
}

const profileName = capsule.profile;
const profile = spine.profiles?.[profileName];
if (!profile) {
  fail(`капсула объявляет профиль "${profileName}", которого схема не знает`);
  process.exit(1);
}

const requiredLayers = profile.required_layers;
if (!Array.isArray(requiredLayers) || requiredLayers.length === 0) {
  fail(`схема не объявляет required_layers для профиля "${profileName}"`);
  process.exit(1);
}

// Утверждение капсулы называет число слоёв ("6"). Сверяем со схемой, а не
// считаем "6" правильным по умолчанию — если схема когда-нибудь изменится,
// расхождение обязано стать видимым здесь, а не молчать.
const claimedCount = 6;
if (requiredLayers.length !== claimedCount) {
  fail(
    `утверждение капсулы называет ${claimedCount} слоёв, схема объявляет ${requiredLayers.length} ` +
    `(${requiredLayers.join(", ")}) — утверждение и схема разошлись`
  );
}

const files = readdirSync(PKO_DIR).filter((f) => f.endsWith(".pko.json"));
if (files.length === 0) {
  fail("в knowledge/pko/ нет ни одной капсулы для проверки");
  process.exit(1);
}

for (const file of files) {
  const path = join(PKO_DIR, file);
  let obj;
  try {
    obj = JSON.parse(readFileSync(path, "utf8"));
  } catch (e) {
    fail(`${file} не разбирается как JSON: ${e.message}`);
    continue;
  }

  if (obj.profile !== profileName) {
    // Капсула другого профиля к этому утверждению не относится — у него
    // может быть другой набор слоёв (module-passport, например), и это не
    // нарушение claim'а про PKO/knowledge-object.
    continue;
  }

  const id = obj.id || file;
  const layers = obj.layers || {};
  const missing = requiredLayers.filter((l) => !layers[l]);
  const declaredCount = requiredLayers.filter((l) => !!layers[l]).length;

  if (missing.length > 0) {
    fail(`[${id}] не имеет всех обязательных слоёв (отсутствуют: ${missing.join(", ")})`);
  } else if (declaredCount !== claimedCount) {
    fail(`[${id}] объявляет ${declaredCount} слоёв, утверждение называет ${claimedCount}`);
  }
}

if (failed) {
  process.exitCode = 1;
} else {
  console.log(
    `GREEN · concept-ccp-001: все капсулы профиля "${profileName}" в knowledge/pko/ несут все ${claimedCount} обязательных слоя (${requiredLayers.join(", ")})`
  );
  process.exitCode = 0;
}
