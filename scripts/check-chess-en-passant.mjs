/**
 * Game Codex — scripts/check-chess-en-passant.mjs
 *
 * local_check for knowledge/pko/chess-en-passant-001.pko.json.
 *
 * До 12.08 local_check капсулы был "npm run benchmark:chess" — команда,
 * гоняющая эвалюатор против CHESS-BENCHMARK-V0.1.md, протокола, отозванного
 * 12.08 за неверный ключ ответов в 6 из 12 фикстур. Машинный критерий
 * флагманской капсулы соглашался с публично отозванной ошибкой.
 *
 * Этот скрипт не трогает отозванный бенчмарк вообще. Он проверяет ИМЕННО
 * утверждение капсулы — правило взятия на проходе (en passant) — независимой
 * реализацией: разбирает FEN из layers.play.config.mechanics, применяет ход
 * из "solution" по правилам FIDE Art. 3.7.3.1–3.7.3.2 (не переиспользуя код
 * отозванного эвалюатора) и сверяет результат с success_fen. Дополнительно
 * сверяет формальные предусловия из layers.model.formal с геометрией доски.
 *
 * Zero dependencies, zero network. Exit 0 = claim holds. Exit 1 = it does not.
 */

import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const PKO_PATH = join(__dirname, "..", "knowledge", "pko", "chess-en-passant-001.pko.json");

function fail(msg) {
  console.error(`RED · ${msg}`);
  process.exitCode = 1;
}

// ── парсинг FEN ────────────────────────────────────────────────────────────
const FILES = ["a", "b", "c", "d", "e", "f", "g", "h"];

function parseSquare(sq) {
  const file = FILES.indexOf(sq[0]);
  const rank = Number(sq[1]); // 1..8
  if (file === -1 || !Number.isInteger(rank) || rank < 1 || rank > 8) {
    throw new Error(`не разбирается как клетка шахматной доски: "${sq}"`);
  }
  return { file, rank };
}

function squareName(file, rank) {
  return `${FILES[file]}${rank}`;
}

// board[rank-1][file] — 0 = a1, индекс по горизонталям снизу вверх, как в FEN
function parseFEN(fen) {
  const parts = fen.trim().split(/\s+/);
  if (parts.length < 4) throw new Error(`FEN не содержит всех обязательных полей: "${fen}"`);
  const [placement, sideToMove, castling, epTarget, halfmove = "0", fullmove = "1"] = parts;

  const ranks = placement.split("/");
  if (ranks.length !== 8) throw new Error(`FEN placement не содержит 8 горизонталей: "${placement}"`);

  const board = [];
  for (let r = 8; r >= 1; r--) {
    const rankStr = ranks[8 - r];
    const row = [];
    for (const ch of rankStr) {
      if (/\d/.test(ch)) {
        for (let i = 0; i < Number(ch); i++) row.push(null);
      } else {
        row.push(ch);
      }
    }
    if (row.length !== 8) throw new Error(`горизонталь "${rankStr}" не содержит 8 клеток`);
    board[r - 1] = row;
  }

  return { board, sideToMove, castling, epTarget, halfmove, fullmove };
}

function pieceAt(pos, file, rank) {
  return pos.board[rank - 1][file];
}

function setPieceAt(pos, file, rank, piece) {
  pos.board[rank - 1][file] = piece;
}

function boardToPlacement(board) {
  const ranks = [];
  for (let r = 8; r >= 1; r--) {
    let rankStr = "";
    let empty = 0;
    for (let f = 0; f < 8; f++) {
      const p = board[r - 1][f];
      if (p === null) {
        empty++;
      } else {
        if (empty > 0) { rankStr += empty; empty = 0; }
        rankStr += p;
      }
    }
    if (empty > 0) rankStr += empty;
    ranks.push(rankStr);
  }
  return ranks.join("/");
}

function normalizeFEN(fen) {
  // сравниваем позицию и очередь хода строго; счётчики полуходов/ходов —
  // не часть утверждения о правиле en passant, поэтому не сравниваются
  const { board, sideToMove, castling, epTarget } = parseFEN(fen);
  return `${boardToPlacement(board)} ${sideToMove} ${castling} ${epTarget}`;
}

// ── применение хода en passant по правилам FIDE ──────────────────────────
function applyEnPassant(fen, moveUCI) {
  const pos = parseFEN(fen);
  if (!/^[a-h][1-8][a-h][1-8]$/.test(moveUCI)) {
    throw new Error(`ход не в формате UCI (напр. "e5d6"): "${moveUCI}"`);
  }
  const from = parseSquare(moveUCI.slice(0, 2));
  const to = parseSquare(moveUCI.slice(2, 4));

  const mover = pieceAt(pos, from.file, from.rank);
  if (!mover || mover.toLowerCase() !== "p") {
    throw new Error(`на клетке "from" (${squareName(from.file, from.rank)}) нет пешки — нашли "${mover}"`);
  }
  const white = mover === "P";

  // Правило FIDE 3.7.3.1: атакующая пешка стоит на своей 5-й горизонтали
  // относительно направления атаки (5-я для белых, 4-я для чёрных)
  const expectedFromRank = white ? 5 : 4;
  if (from.rank !== expectedFromRank) {
    throw new Error(
      `атакующая пешка не на требуемой горизонтали: ожидалась ${expectedFromRank}-я, найдена ${from.rank}-я`
    );
  }

  // цель хода обязана быть объявленным полем взятия на проходе в самом FEN —
  // это то, что удостоверяет "противник только что сделал двойной ход"
  if (pos.epTarget !== squareName(to.file, to.rank)) {
    throw new Error(
      `клетка назначения (${squareName(to.file, to.rank)}) не совпадает с полем en passant, объявленным в FEN ("${pos.epTarget}")`
    );
  }
  if (Math.abs(to.file - from.file) !== 1) {
    throw new Error("взятие на проходе обязано быть на соседний файл по диагонали");
  }

  // взятая пешка стоит не на клетке "to", а на клетке позади неё — там, где
  // она реально находится после двойного хода ("как если бы прошла одну клетку")
  const capturedRank = from.rank;
  const captured = pieceAt(pos, to.file, capturedRank);
  if (!captured || captured.toLowerCase() !== "p" || (captured === "P") === white) {
    throw new Error(
      `на клетке взятия (${squareName(to.file, capturedRank)}) нет пешки противника — нашли "${captured}"`
    );
  }

  setPieceAt(pos, from.file, from.rank, null);
  setPieceAt(pos, to.file, capturedRank, null);
  setPieceAt(pos, to.file, to.rank, mover);

  const resultBoard = pos.board;
  const resultSide = white ? "b" : "w";
  return `${boardToPlacement(resultBoard)} ${resultSide} ${pos.castling} - 0 1`;
}

// ── прогон ────────────────────────────────────────────────────────────────
let capsule;
try {
  capsule = JSON.parse(readFileSync(PKO_PATH, "utf8"));
} catch (e) {
  fail(`капсула не читается или не разбирается как JSON: ${e.message}`);
  process.exit();
}

const mech = capsule?.layers?.play?.config?.mechanics;
if (!mech) {
  fail("layers.play.config.mechanics отсутствует — нечего проверять");
  process.exit();
}

const { fen, success_fen: successFen, solution } = mech;
if (!fen || !successFen || !solution) {
  fail("layers.play.config.mechanics не содержит fen, success_fen и solution одновременно");
  process.exit();
}

let resultFen;
try {
  resultFen = applyEnPassant(fen, solution);
} catch (e) {
  fail(`применение хода "${solution}" к позиции по правилам FIDE провалилось: ${e.message}`);
  process.exit();
}

if (normalizeFEN(resultFen) !== normalizeFEN(successFen)) {
  fail(
    `результат независимой симуляции взятия на проходе не совпал с layers.play.config.mechanics.success_fen\n` +
    `  ожидалось : ${normalizeFEN(successFen)}\n` +
    `  получено  : ${normalizeFEN(resultFen)}`
  );
  process.exit();
}

// ── сверка формальных предусловий из layers.model с геометрией доски ──────
const formal = capsule?.layers?.model?.formal;
const preconditions = formal?.preconditions;
if (!Array.isArray(preconditions) || preconditions.length === 0) {
  fail("layers.model.formal.preconditions отсутствует — утверждение о правиле не формализовано");
  process.exit();
}

const from = parseSquare(solution.slice(0, 2));
const to = parseSquare(solution.slice(2, 4));
const startPos = parseFEN(fen);
const attackerWhite = startPos.sideToMove === "w";

const checks = [
  {
    ok: preconditions.some((p) => /rank ==/.test(p)),
    msg: "модель не формализует условие горизонтали атакующей пешки",
  },
  {
    ok: from.rank === (attackerWhite ? 5 : 4),
    msg: "атакующая пешка в сценарии play не стоит на горизонтали, требуемой моделью",
  },
  {
    ok: Math.abs(to.file - from.file) === 1,
    msg: "клетка взятия в сценарии play не на соседнем файле — не совпадает с моделью",
  },
];

for (const c of checks) {
  if (!c.ok) fail(c.msg);
}

if (process.exitCode === 1) {
  process.exit();
}

console.log("GREEN · en passant: независимая симуляция подтвердила play-сценарий и формальную модель капсулы chess-en-passant-001");
process.exitCode = 0;
