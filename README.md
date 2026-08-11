# game-codex — Playable Knowledge Factory

[![selftest](https://github.com/Igor-Zinin/game-codex/actions/workflows/selftest.yml/badge.svg)](https://github.com/Igor-Zinin/game-codex/actions/workflows/selftest.yml)
[![code: MIT](https://img.shields.io/badge/code-MIT-lightgrey)](LICENSE-CODE)
[![knowledge: CC BY 4.0](https://img.shields.io/badge/knowledge-CC%20BY%204.0-lightgrey)](LICENSE)
[![live page](https://img.shields.io/badge/live-igor--zinin.github.io%2Fgame--codex-blue)](https://igor-zinin.github.io/game-codex/docs/)

---

```mermaid
flowchart LR
    A(["📚 KNOWLEDGE\n(Canon / Wiki)"])
    B(["⚙️ PKO\n(Playable Knowledge Object)"])
    C(["▶ PAGE\n(docs/index.html)"])
    D(["✅ EVIDENCE\n(FIDE / authoritative ref)"])
    E(["🔒 CLAIM\n(acceptance_sql)"])

    A -->|"auditor + selftest CHECK"| B
    B -->|"6 layers, fetched as-is"| C
    B -->|"ref + proof"| D
    D -->|"machine criterion"| E

    subgraph KERNEL ["zero dependencies"]
        B
        D
        E
    end

    style A fill:#1f4068,color:#e2e2e2,stroke:#4d9de0
    style B fill:#3b1f5e,color:#e2e2e2,stroke:#9b59b6
    style C fill:#7b3f00,color:#e2e2e2,stroke:#e67e22
    style D fill:#145a32,color:#e2e2e2,stroke:#27ae60
    style E fill:#0e4d47,color:#e2e2e2,stroke:#1abc9c
    style KERNEL fill:#0d1117,color:#888,stroke:#30363d
```

> **Core Principle: Every important CLAIM in this repository has an executable CHECK.**
> `CLAIM ──► CHECK ──► EXECUTION ──► RESULT ──► EVIDENCE`

---

## What is a PKO?

A **Playable Knowledge Object (PKO)** is the minimum unit of this factory.
One game rule → one PKO → six representations of the same knowledge:

| Layer | Purpose |
|---|---|
| `answer` | Human-readable explanation |
| `evidence` | Authoritative reference (FIDE rule, paper, etc.) |
| `model` | Formal preconditions and logic |
| `play` | Browser-interactive mini-scene — position, task, move validation, and success state |
| `quiz` | Questions to test understanding |
| `machine` | `acceptance_sql` — machine-checkable criterion |

```bash
node selftest.mjs   # verifies structure + all PKOs
```

Zero dependencies, zero database. Network read-only for online evidence verification in C-06 (FIDE quote assertion), no keys — just Node 18+.

---

## Quick start

```bash
git clone https://github.com/Igor-Zinin/game-codex
cd game-codex
node selftest.mjs
```

To read the object in a browser, serve the repo root and open `/docs/`
(the page loads the PKO with `fetch`, so `file://` will not work):

```bash
python -m http.server 8000    # then http://localhost:8000/docs/
```

---

## Monorepo layout

```
packages/
  auditor/         ← PKO structural auditor (from DaemonTycoon)

knowledge/
  pko/             ← PKO atoms: *.pko.json — the canon

docs/
  index.html       ← public page: all 6 layers of one PKO, no framework, no CDN
  style.css
  data/            ← byte-copy of knowledge/pko for GitHub Pages; drift is caught by C-05

scripts/
  sync-docs.mjs    ← refreshes docs/data/ from the canon

selftest.mjs       ← C-01…C-05: every claim has a check
LICENSE            ← CC BY 4.0 — knowledge atoms, schemas, docs
LICENSE-CODE       ← MIT — code
```

`docs/data/` is a second copy of the same bytes, which is normally how a
repository starts lying to itself. Here it cannot: `selftest.mjs` (C-05) compares
it byte-for-byte with `knowledge/pko/` and goes red on any divergence. Run
`node scripts/sync-docs.mjs` after editing a PKO.

---

## The public page

[`docs/index.html`](docs/index.html) renders one PKO in full: claim, evidence with a
link to the FIDE source, formal model, and an interactive board position built from the `fen`
field, quiz with hidden answers, and the machine criterion. Nothing is retyped into
the HTML — every value is read from the `.pko.json` at runtime, and an empty field is
drawn as a dash rather than filled in with a guess.

Live: **https://igor-zinin.github.io/game-codex/docs/**

---

## What is not here

- No external game engine is required for the first object. The `play` layer is a
  browser-native interactive scene: select the white pawn, select a destination,
  receive feedback, and see the resulting position. A richer engine may be added later.
- No AI model — evidence must be authoritative (FIDE rules, papers, etc.).
- No XKS schema validator. The Python one imported in Phase B arrived byte-corrupted
  and was removed rather than left in place as a green-looking file that never parsed.
- No external users yet. Zero. The first fork that runs the selftest will be the first.

---

## P1: Chess vertical slice

First PKO atom: [`knowledge/pko/chess-en-passant-001.pko.json`](knowledge/pko/chess-en-passant-001.pko.json)

**Claim:** En passant is a special pawn capture valid only on the turn immediately after an opponent's double pawn advance.
**Evidence:** FIDE Laws of Chess 2023, Article 3.7(d).
**Status:** All 6 layers complete. selftest GREEN.
**Readable form:** [`docs/index.html`](docs/index.html) — the same object for a human, rendered from the same JSON.

---

## Where we stand

A benchmark claim published without naming the neighbors who already measure the
same territory does not survive review. This is not courtesy — it is how the
factory's own doctrine ("lean on shoulders, do not cut down") applies to itself:
we are not competing with the projects below, we are sitting on top of what they
already built.

| Project | What it measures | How we differ |
|---|---|---|
| [LMGame-Bench](https://arxiv.org/abs/2505.15146) ([code](https://github.com/lmgame-org/GamingAgent)) — ICLR 2026 | Perception and planning across six games (Sokoban, Tetris, Candy Crush, 2048, Super Mario Bros, Ace Attorney) via a modular harness; 13 models evaluated. | They run live agents against six real games today; we have one browser-interactive PKO and zero model runs. Where they are ahead, they are simply ahead. |
| [BALROG](https://arxiv.org/abs/2411.13543) — ICLR 2025, [balrogai.com](https://balrogai.com) | Agentic LLM/VLM reasoning in long-horizon, procedurally generated environments (NetHack and others), with a live, weekly-updated leaderboard. | They have a running leaderboard and verified submissions; we have no agent execution and no leaderboard at all. |
| [TextArena](https://arxiv.org/abs/2504.11442), [textarena.ai](https://www.textarena.ai/) | 70+ text games, live play against humans and models, real-time TrueSkill ratings. | They measure live play at scale; our first object is a small browser scene, not yet a model benchmark. Pure breadth and scale loss on our side. |
| [Kaggle Game Arena](https://www.kaggle.com/game-arena) | Head-to-head model tournaments (chess now, Go/poker planned), all-play-all format, Google-run infrastructure. | Different genre entirely — a tournament platform, not a knowledge repository. We have no comparable infrastructure and are not building one. |
| [ChessQA](https://arxiv.org/abs/2510.23948) | LLM chess understanding across five categories: structural rules, motifs, tactics, position judgment, semantics. | Same domain (chess), opposite grain: they cover breadth of chess knowledge with many questions per model; we cover one rule (en passant) to full depth — six representations, one machine-checkable criterion, one proof. |
| [GVGAI-LLM](https://arxiv.org/abs/2508.08501) | Procedurally-infinite arcade games via ASCII rendering; spatial reasoning and planning across nine LLMs. | They already have a scoring engine; our `play` layer is still a scene config with no renderer (see "What is not here" above). |

**What we actually have, stated plainly:** one PKO object, zero live measurements,
zero external users. Minesweeper and Connect Four are plan, not inventory — they
do not exist in this repo yet.

**Our one thesis:** every project above publishes a score as of today. We publish
a decay curve per claim, with a proof and a death date attached to each one. Our
unit of measurement is a checkable claim, not a game.

**Why this shelf exists at all — saturation.** A 2026 study of 60 widely-cited
LLM benchmarks found 29 already highly saturated (Sindex ≥ 0.7), 14 of those very
highly saturated (≥ 0.9) — [arXiv:2602.16763](https://arxiv.org/abs/2602.16763).
BIG-Bench Hard is the canonical case: assembled in 2022 specifically from tasks
that were *hard* for language models at the time
([arXiv:2210.09261](https://arxiv.org/abs/2210.09261)), and by 2024–2026 frontier
models clear it above 90%, leaving it useful mostly for mid-tier and open-weight
comparison. A score frozen on a leaderboard has no way to say when it stopped
being a good question — a decay-dated claim does.

---

## Donors (Phase A Forensic Merge Map)

This repo grew out of 4 private repos. The full asset-by-asset classification
(ADOPT / EXTRACT / ADAPT / ARCHIVE / REJECT) is not published.

Only what is actually in the tree is listed as taken — everything else is still
sitting in the donors:

| Donor | Role | Taken so far |
|---|---|---|
| `DaemonTycoon` | Factory OS | Auditor engine (`packages/auditor`) — reworked, Firebase/Telegram dependency stripped |
| `knowledge-matrix-contour` | Canon Source | XKS ideas: layer set, provenance and decay stamps |
| `Game` | Public Shell | nothing yet |
| `HeartStone-2` | Simulation | nothing yet |

---

## License

The repository is mixed, so there are two licenses — pick the one matching what you take.

| What | License | File |
|---|---|---|
| **Code**: `selftest.mjs`, `packages/**`, `scripts`, build glue | **MIT** | [`LICENSE-CODE`](LICENSE-CODE) |
| **Knowledge and texts**: `knowledge/**` PKO atoms, schemas, README | **CC BY 4.0** | [`LICENSE`](LICENSE) |

Third-party material keeps its own terms. Authoritative references cited in the
`evidence` layer of a PKO (FIDE Laws of Chess, papers) belong to their rights
holders and are cited, not redistributed.
