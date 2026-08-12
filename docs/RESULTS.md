# Results

This page is the human-readable index of the Game Codex Observatory. The machine-readable
registry is [`data/RESULTS.json`](data/RESULTS.json); historical entries are append-only.

## Chess v0.1

| Run | Model/provider | Trials | Fixtures | Passed | Failed | Incomplete | Status |
|---|---|---:|---:|---:|---:|---:|---|
| 2026-08-11 reference control | deterministic fixture / no provider | 3 | 12 | 36 | 0 | 0 | protocol check, not a model result |
| 2026-08-12 Gemini 3.6 Flash / Antigravity | Google Gemini | 3 | 12 | 18 | 18 | 0 | submitted · 50% |

The [raw trajectories and deterministic verdict](data/submissions/gemini-antigravity-chess-v0.1/evaluation.json)
are preserved with [run metadata](data/submissions/gemini-antigravity-chess-v0.1/metadata.json).
The raw files were not normalized or repaired before scoring.

### Capability profile

The control run confirms that the protocol and evaluator agree across:

- legal and deliberately illegal moves;
- white/black en-passant symmetry;
- board-state reconstruction;
- tactical and explanation fields;
- multi-turn interactive trajectories.

The first provider profile shows a useful split: Gemini passed all legality and tactics
fixtures (18/18) but failed state tracking, explanation, and interactive-play fixtures
(18/18). It returned correct-looking FENs in some state and interactive fields, but the
protocol requires move trajectories and grounded explanation text; the evaluator therefore
does not infer missing fields.

It does not measure an AI provider. No model score is claimed until a submission includes
the model snapshot, provider, prompt, tools, sampling configuration, raw responses, cost,
latency, and the deterministic verdict produced by the pinned evaluator.

## Reading the numbers

`passed`, `failed`, and `incomplete` are kept separate. A timeout, unparsable response, or
unfinished interaction is not silently converted into a loss or a pass. A future model
entry should be compared by capability profile and by trial history, not by one composite
number.

## Next public result

The next milestone is an independently generated second provider profile, preferably
Claude Opus under the same blinded protocol. The Gemini entry remains `submitted` until
an independent reproduction is available.
