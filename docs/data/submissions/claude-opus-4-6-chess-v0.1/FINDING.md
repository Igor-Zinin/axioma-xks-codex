# Finding: Chess v0.1's answer key is wrong on 6 of 12 fixtures

Status: `finding_not_a_score`. This is not a model result and no score is published for it.
See [metadata.json](metadata.json) for why.

## What happened

On 2026-08-12, Claude Opus 4.6 (Thinking), via Antigravity, was run against the Chess v0.1
evaluation kit under the same sterile protocol used for the published Gemini submission:
blind kit, no tools, no internet, three requested independent trials with fresh context per
trial. Trial 1 failed before producing output (`RESOURCE_EXHAUSTED`, HTTP/code 429, an API
quota limit) and was not retried, substituted, or reconstructed — there is no trial-01 file
in this submission, and none should be inferred. Trials 2 and 3 completed and were saved
unedited to [`raw/claude-opus-4-6-trial-02.json`](raw/claude-opus-4-6-trial-02.json) and
[`raw/claude-opus-4-6-trial-03.json`](raw/claude-opus-4-6-trial-03.json).

In both completed trials, the model's answers disagreed with the chess-v0.1 answer key on
exactly the same six fixtures, and agreed with the key on the other six. The disagreement
was not a coin flip that happened to land the same way twice — it is the model consistently
applying two chess rules the key gets backwards.

## The six fixtures, model vs. key

| Fixture | Key says | Opus 4.6 said (both trials) | Who is right, and why |
|---|---|---|---|
| `legality-white-illegal-forward` | `legal: false` for `e5e6` | `legal: true` | Opus. En passant is a right, not an obligation. Declining it and pushing the pawn to an empty square is an ordinary legal move. |
| `legality-black-illegal-forward` | `legal: false` for `e4e3` | `legal: true` | Opus, mirrored. |
| `state-white-ep` | `state_fen` ends `w - - 0 1` | `state_fen` ends `b - - 0 1` | Opus. White just played `e5d6`; the side to move must flip to black. |
| `state-black-ep` | `state_fen` ends `b - - 0 1` | `state_fen` ends `w - - 0 2` | Opus. Black just played `e4d3`; the side to move flips to white and the full-move counter increments after black's move, per standard FEN rules. |
| `interactive-white-ep` | same wrong `expected_fen` as `state-white-ep` | same corrected FEN | Opus, same reasoning. |
| `interactive-black-ep` | same wrong `expected_fen` as `state-black-ep` | same corrected FEN | Opus, same reasoning. |

The model's own explanations, given for the `explanation-white-ep` and `explanation-black-ep`
fixtures (which are not among the disputed six and were answered in agreement with the key),
independently describe en passant as a capture that is "only available on the very next move"
and is "forfeited" if not taken — i.e., the model states unprompted, in the fixtures where it
was asked to explain rather than judge, the same rule it applied when judging the disputed
fixtures. It is not an inconsistent model; it is a model with one coherent, correct
understanding of en passant, applied everywhere it appears in the kit.

## Why the disagreement is real and not model error

Every position in Chess v0.1 omits both kings. None of them is a legal chess position by
FIDE rules, and no chess engine will load one — which is exactly why the project's evaluator
uses hand-written move and legality logic instead of an engine. That hand-written logic
encoded two mistakes: it treats en passant as mandatory when available (so declining it marks
an otherwise-legal move `illegal`), and it does not update side-to-move or the full-move
counter after a move in the `state_tracking` fixtures. Both mistakes are checkable against the
FIDE Laws of Chess directly, independent of any model's opinion — see
[`knowledge/pko/chess-en-passant-001.pko.json`](../../../../knowledge/pko/chess-en-passant-001.pko.json)
and the FIDE citation it carries. Full detail and the corrected values are in
[`docs/CHESS-BENCHMARK-V0.1.md`](../../../CHESS-BENCHMARK-V0.1.md#wrong-key-the-six-broken-fixtures).

## Consistency: 100%, both trials, all six fixtures

Trial 2 and trial 3 used fresh context and were run independently. They agree with each other
on all twelve fixtures, including all six disputed ones, and both disagree with the key in the
identical direction on the identical six fixtures. That is a 100% reproduction rate on the
finding, from two trials that could not have seen each other's output.

## The conclusion

Chess v0.1, as currently keyed, does not just fail to reward chess knowledge — it actively
penalizes it. A model that knows en passant is optional, and that knows turns alternate, loses
points that a model reproducing the key's own mistakes would keep. Gemini 3.6 Flash's
published 36/36 on this protocol is consistent with either superior play or with agreeing with
a wrong key; this finding is evidence for the latter explanation, since a materially different
model model landed on the correct chess rules and was marked wrong for it.

## Why this finding exists at all

The operator running this reproduction did not edit either the model's raw output or the
answer key when the two disagreed. The disagreement was written down in
[`NOTES.md`](NOTES.md) at the time it was observed, and the raw JSON was preserved exactly as
produced. That is the entire reason this finding surfaced: a quieter operator could have
"corrected" the model's answers to match the key, scored it low, and never noticed the key was
the thing that was wrong.
