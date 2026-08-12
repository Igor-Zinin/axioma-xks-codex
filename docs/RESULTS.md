# Results

This page is the human-readable index of the Game Codex Observatory. The machine-readable
registry is [`data/RESULTS.json`](data/RESULTS.json); historical entries are append-only.
A withdrawn result is marked, never deleted.

## Chess v0.1 — `retired`

| Run | Model/provider | Trials | Fixtures | Passed | Failed | Incomplete | Status |
|---|---|---:|---:|---:|---:|---:|---|
| ~~2026-08-11 reference control~~ | ~~deterministic fixture / no provider~~ | 3 | 12 | ~~36~~ | ~~0~~ | 0 | **retired** · scored against a wrong key, see below |
| ~~2026-08-12 Gemini 3.6 Flash / Antigravity~~ | ~~Google Gemini~~ | 3 | 12 | ~~36~~ | ~~0~~ | 0 | **retired** · scored against a wrong key, see below |
| ~~2026-08-12 Gemini 3.6 Flash / Antigravity~~ | ~~Google Gemini~~ | 3 | 12 | ~~18~~ | ~~18~~ | 0 | **withdrawn** · scoring error, see below |
| 2026-08-12 Claude Opus 4.6 / Antigravity (2 of 3 trials) | Anthropic via Antigravity | 2 | 12 | — | — | — | **finding, not a score** · see [FINDING.md](data/submissions/claude-opus-4-6-chess-v0.1/FINDING.md) |

The [raw trajectories](data/submissions/gemini-antigravity-chess-v0.1/raw/) are the same
bytes in all three Gemini rows: they were never normalized, repaired, or re-run. Only the
evaluator changed, and then the protocol itself was retired out from under all three rows —
see [Why this protocol is retired](#why-this-protocol-is-retired) below.

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

## Why this protocol is `retired`

Six of the twelve fixtures in Chess v0.1 have a wrong answer key. Every fixture position
omits both kings, so none of them is a legal chess position, and no chess engine will accept
one. The project wrote hand-rolled move and legality logic to judge these fixtures in place
of an engine, and that hand-rolled logic encoded two mistaken beliefs: that en passant is
mandatory rather than optional, and that the side to move and full-move counter do not
change after a move. Both beliefs are wrong, and both were caught only when a second model
disagreed with the key in a way that could not be explained by the second model being wrong.
Full detail, including the corrected values for all six fixtures, is in
[CHESS-BENCHMARK-V0.1.md](CHESS-BENCHMARK-V0.1.md#wrong-key-the-six-broken-fixtures).

This is retirement, not saturation, and the difference is not cosmetic. A saturated protocol
measured correctly and stopped separating models — its scores stay in the record because they
were true. Chess v0.1 never measured correctly on six of twelve fixtures: a passing score
there meant "agreed with a mistake," and a failing score meant "knew the rules better than
the benchmark did." Both the reference control's 36/36 and Gemini's 36/36 are retired along
with the protocol, for the same reason — see the table above. Gemini's earlier 18/18 split
under evaluator 0.1.0 remains separately withdrawn for the unrelated field-name defect
described above under [Correction — the withdrawn 50% result](#correction--the-withdrawn-50-result).

An older, independent defect would have limited this protocol's usefulness even with a
correct key: it rests on only two en-passant positions, and its `state_tracking` and
`interactive_play` families each contain a single move — neither measures a trajectory,
whatever the family names promise. That defect is superseded by the wrong-key finding, but
v0.2 needs to fix it too.

The fixtures are not being corrected in this version. They stay wrong, on purpose, as a
record of the error. A new protocol version gets the fix.

## Finding: Claude Opus 4.6 reproduces the disagreement, twice, at 100%

Two independent trials of Claude Opus 4.6 (Anthropic, via Antigravity) were run against the
Chess v0.1 kit on 2026-08-12 — a planned third trial hit an API quota error
(`RESOURCE_EXHAUSTED`, code 429) before producing output and was not substituted or
reconstructed. In both completed trials, the model disagreed with the answer key on the same
six fixtures identified above, and agreed with the key on all six remaining fixtures. The
disagreement was not scored, because two trials is below this protocol's three-trial minimum
and because scoring against a confirmed-wrong key would not mean anything. It is published as
a finding, not a result: [FINDING.md](data/submissions/claude-opus-4-6-chess-v0.1/FINDING.md),
with raw trajectories, prompt, and run log at
[data/submissions/claude-opus-4-6-chess-v0.1/](data/submissions/claude-opus-4-6-chess-v0.1/).
The operator who ran it kept the raw output unedited and logged the disagreement in `NOTES.md`
instead of adjusting either the model's answers or the key — that discipline is the only
reason this finding surfaced at all.

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
