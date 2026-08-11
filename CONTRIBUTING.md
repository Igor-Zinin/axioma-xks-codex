# Contributing to Game Codex

Thank you for your interest in contributing to **Game Codex** — the open Playable Knowledge Object (PKO) specification and benchmark suite.

## What is a Playable Knowledge Object (PKO)?

A PKO is an executable, machine-verifiable knowledge capsule. Every PKO MUST contain 6 mandatory layers:

1. `answer`: Human-readable explanation and difficulty level.
2. `evidence`: Primary authoritative reference (e.g. FIDE handbook) with exact quote and URL.
3. `model`: Formal preconditions and state space.
4. `play`: Interactive board/state representation.
5. `quiz`: Self-assessment questions with verifiable right answers.
6. `machine`: Executable SQL/code assertion for automated evaluation (`acceptance_sql`).

---

## How to Add a New PKO

1. Create a new `.pko.json` file in `knowledge/pko/<game>-<concept>-<id>.pko.json`.
2. Follow the 6-layer PKO schema (see `knowledge/pko/chess-en-passant-001.pko.json` as reference).
3. Run the automated verification suite:

```bash
node selftest.mjs
```

All assertions (C-01 to C-06) MUST pass before submitting a Pull Request.

---

## Code of Conduct & DCO

By contributing, you agree that your submissions comply with the **Developer Certificate of Origin (DCO)** under the open licenses of this repository (MIT for code, CC BY 4.0 for knowledge objects).
