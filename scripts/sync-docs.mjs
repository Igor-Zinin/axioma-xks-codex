/**
 * Game Codex — scripts/sync-docs.mjs
 *
 * GitHub Pages отдаёт статику без сборки, поэтому страница docs/index.html
 * обязана видеть PKO по относительному пути внутри docs/. Канон при этом
 * один — knowledge/pko/. Этот скрипт делает docs/data/ побайтовой копией
 * канона, а selftest (C-05) краснеет, если копия разошлась с оригиналом.
 *
 * Второй источник допустим только тогда, когда его расхождение ловится
 * проверкой. Здесь — ловится.
 *
 * Zero dependencies. Run: node scripts/sync-docs.mjs
 */

import { readdirSync, readFileSync, writeFileSync, mkdirSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const SRC = join(__dirname, "..", "knowledge", "pko");
const DST = join(__dirname, "..", "docs", "data");

mkdirSync(DST, { recursive: true });

const files = readdirSync(SRC).filter((f) => f.endsWith(".pko.json"));
let copied = 0;

for (const file of files) {
  const bytes = readFileSync(join(SRC, file));
  writeFileSync(join(DST, file), bytes);
  copied++;
  console.log(`  ${file} → docs/data/${file}`);
}

console.log(`\nsync-docs: ${copied} PKO copied to docs/data/\n`);
