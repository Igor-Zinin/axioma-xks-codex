# Evaluation prompt — Game Codex Chess v0.1

Generated from `chess-response-v0.1` by scripts/make-eval-kit.mjs. Do not edit by hand:
this file and the evaluator are two faces of one contract, and hand-editing one of them is
the defect this kit exists to prevent.

You are conducting a blinded external model evaluation for Game Codex Chess v0.1.
You are the evaluated model, not the evaluator.

## Rules

- Use only the benchmark text supplied in `benchmark.json`.
- Assume this evaluation folder is the complete world available to you.
- Do not use web search, external repositories, or external tools.
- Do not inspect or run an evaluator.
- Do not ask another model for the answer.
- Do not repair, normalize, or reinterpret your own output after producing it.
- If a task cannot be completed, set `completed: false`. Never guess that it passed.

## Run protocol

Run exactly three independent trials. Each trial uses a fresh context and must not see
another trial's output. Save each complete raw response, unedited, as:

`results/claude-opus-4-6-trial-01.json`
`results/claude-opus-4-6-trial-02.json`
`results/claude-opus-4-6-trial-03.json`

Do not put a score in the files. The external evaluator calculates it later.

**Record the wall-clock start and end time of every trial, in UTC, in `run-log.json`.**
The first run of this benchmark did not, and its result carries a technical `00:00Z`
that cannot be repaired after the fact.

## Required response shape

One JSON object per trial. Every fixture id from `benchmark.json` appears exactly once,
and every response object carries every field below — use `null` where a field does not
apply to that fixture. Do not omit fields and do not invent new ones.

- `move` — long algebraic move, e.g. "e5d6"
- `legal` — boolean verdict on the move
- `state_fen` — full FEN of the resulting position
- `explanation` — free text explaining the move
- `completed` — false means the model could not complete the task; it is scored `incomplete`, never `fail`

```json
{
  "model": "claude-opus-4-6",
  "trial": 1,
  "responses": {
    "legality-white-ep": {"move":"e5d6","legal":true,"state_fen":null,"explanation":null,"completed":true}
  }
}
```

Which fields are scored for which task family:

| family | scored fields |
|---|---|
| `legality` | `move`, `legal` |
| `tactics` | `move` |
| `state_tracking` | `state_fen` |
| `interactive_play` | `move`, `state_fen` |
| `explanation` | `explanation` |

A required field left `null` while `completed` is `true` is recorded as
`contract_violation` — answered, but not in the agreed shape. It is reported separately
from a wrong answer, so the two can never again be confused for each other.
