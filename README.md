# game-codex — Playable Knowledge Factory

[![selftest](https://github.com/Igorz1993/game-codex/actions/workflows/selftest.yml/badge.svg)](https://github.com/Igorz1993/game-codex/actions/workflows/selftest.yml)
[![license](https://img.shields.io/badge/license-Apache--2.0-lightgrey)](LICENSE)

---

```mermaid
flowchart LR
    A(["📚 KNOWLEDGE\n(Canon / Wiki)"])
    B(["⚙️ PKO\n(Playable Knowledge Object)"])
    C(["▶ PLAY\n(Phaser3 mini-scene)"])
    D(["✅ EVIDENCE\n(FIDE / authoritative ref)"])
    E(["🔒 CLAIM\n(acceptance_sql)"])

    A -->|"validate.py CHECK"| B
    B -->|"6 layers"| C
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
One game rule → one PKO → seven representations of the same knowledge:

| Layer | Purpose |
|---|---|
| `answer` | Human-readable explanation |
| `evidence` | Authoritative reference (FIDE rule, paper, etc.) |
| `model` | Formal preconditions and logic |
| `play` | Phaser3 interactive mini-scene config |
| `quiz` | Questions to test understanding |
| `machine` | `acceptance_sql` — machine-checkable criterion |

```bash
node selftest.mjs   # verifies structure + all PKOs
```

No dependencies, no network, no database, no keys — just Node 18+.

---

## Quick start

```bash
git clone https://github.com/Igorz1993/game-codex
cd game-codex
node selftest.mjs
```

To validate all PKO atoms against the XKS schema:

```bash
python packages/knowledge-api/validate.py
```

---

## Monorepo layout

```
packages/
  knowledge-api/   ← XKS validator (from knowledge-matrix-contour)
  auditor/         ← PKO structural auditor (from DaemonTycoon)
  game-shell/      ← Phaser3 Play-layer renderer (from Game)

knowledge/
  pko/             ← PKO atoms: *.pko.json

docs/
  DAEMON-CAPABILITIES.md   ← factory capabilities reference
  FORENSIC-MERGE-MAP.md    ← how 4 repos were merged into this one

selftest.mjs       ← C-05: every claim has a check
```

---

## What is not here

- No full game engine — we use existing Phaser3.
- No AI model — evidence must be authoritative (FIDE rules, papers, etc.).
- No external users yet. Zero. The first fork that runs the selftest will be the first.

---

## P1: Chess vertical slice

First PKO atom: [`knowledge/pko/chess-en-passant-001.pko.json`](knowledge/pko/chess-en-passant-001.pko.json)

**Claim:** En passant is a special pawn capture valid only on the turn immediately after an opponent's double pawn advance.
**Evidence:** FIDE Laws of Chess 2023, Article 3.7(d).
**Status:** All 6 layers complete. selftest GREEN.

---

## Donors (Phase A Forensic Merge Map)

This repo is a merger of 4 existing repos. See [`docs/FORENSIC-MERGE-MAP.md`](docs/FORENSIC-MERGE-MAP.md) for the full classification (ADOPT / EXTRACT / ADAPT / ARCHIVE / REJECT) of all 63 assets.

| Donor | Role | Key contribution |
|---|---|---|
| `Game` | Public Shell | Phaser3 renderer, Next.js, NeoPanel UI |
| `DaemonTycoon` | Factory OS | Auditor engine, Context Compiler |
| `HeartStone-2` | Simulation | Combat kernel, MCP bridge |
| `knowledge-matrix-contour` | Canon Source | XKS validator, 19k-node ontology graph |

---

## License

Apache-2.0 for code. Knowledge atoms in `knowledge/` follow CC BY 4.0 where derived from CC BY sources.
