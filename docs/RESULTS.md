# Results

This page is the human-readable index of the Game Codex Observatory. The machine-readable
registry is [`data/RESULTS.json`](data/RESULTS.json); historical entries are append-only.
A withdrawn result is marked, never deleted.

## Chess v0.1 — `saturated`

| Run | Model/provider | Trials | Fixtures | Passed | Failed | Incomplete | Status |
|---|---|---:|---:|---:|---:|---:|---|
| 2026-08-11 reference control | deterministic fixture / no provider | 3 | 12 | 36 | 0 | 0 | protocol check, not a model result |
| 2026-08-12 Gemini 3.6 Flash / Antigravity | Google Gemini | 3 | 12 | 36 | 0 | 0 | submitted · 100% · evaluator 0.2.0 |
| ~~2026-08-12 Gemini 3.6 Flash / Antigravity~~ | ~~Google Gemini~~ | 3 | 12 | ~~18~~ | ~~18~~ | 0 | **withdrawn** · scoring error, see below |

The [raw trajectories](data/submissions/gemini-antigravity-chess-v0.1/raw/) are the same
bytes in both rows: they were never normalized, repaired, or re-run. Only the evaluator
changed.

## Correction — the withdrawn 50% result

The first published Gemini profile was wrong, and the error was ours.

The sterile kit handed to the evaluated model specified a response object with the fields
`move`, `legal`, `state_fen`, `explanation`, `completed`. Evaluator 0.1.0 read `moves` and
`text`. The model answered in the shape it was given — every fixture, every trial — and was
scored as though it had failed to follow the protocol. Three whole task families were
published as 0/6 while the submitted answers were correct: the FENs matched the expected
positions exactly, and the explanations contained the required concepts and none of the
forbidden ones.

Two independent statements of one contract existed in this project, and nothing compared
them. That is the defect, and it is fixed at the root rather than patched: the response
contract is now a single file, [`data/chess-response-contract-v0.1.json`](data/chess-response-contract-v0.1.json),
from which both the evaluator and the submitter's prompt are derived. The reference baseline
is generated from it by `scripts/make-baseline.mjs` instead of being maintained by hand, and
the selftest fails if the two ever diverge again.

Evaluator 0.2.0 also separates `contract_violation` — a required field absent while the model
claims completion — from `fail`. Under 0.1.0 those two were the same number, which is why a
compliant model and a wrong model looked alike.

The reference control run scores 36/36 under both evaluator versions. The change did not
loosen the protocol; it stopped the protocol from reading a field nobody was asked to send.

## Why this protocol is now marked `saturated`

A 100% profile does not separate models. Chess v0.1 rests on two en-passant positions, and
its `state_tracking` and `interactive_play` families each contain a single move — so neither
measures a trajectory, whatever their names promise. It was a working instrument for proving
that the pipeline runs end to end. It is not an instrument for comparing providers.

Per the saturation rule, v0.1 stays in the historical record with its scores intact. A second
provider profile against it would produce another 36/36 and mean nothing. New positions,
out-of-distribution states, and genuine multi-turn trajectories belong to a new protocol
version, and old scores are not rewritten.

## Reading the numbers

`passed`, `failed`, `contract_violations`, and `incomplete` are kept separate. A timeout,
unparsable response, or unfinished interaction is not silently converted into a loss or a
pass. A model entry should be compared by capability profile and trial history, not by one
composite number.

Known gap in the 2026-08-12 run: per-trial start and end timestamps were not recorded. The
date carries a technical `00:00Z` and has not been back-dated to a guess. Timestamps are
mandatory from v0.2 onward.

## Next public result

Chess v0.2 first — a protocol that can still tell two models apart. A second provider profile
is only meaningful once there is something left to measure.
