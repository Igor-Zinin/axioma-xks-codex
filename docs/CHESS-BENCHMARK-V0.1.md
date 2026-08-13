# Chess Benchmark v0.1 — `retired`

> **Status: retired as of 2026-08-12.** Six of the twelve answer-key fixtures are wrong, and
> the error is structural: none of the source positions contain a king, so none of them are
> legal chess positions, and no chess engine will accept them. The project wrote hand-rolled
> move logic to judge these fixtures instead, and that hand-rolled logic reproduced the
> author's own misunderstanding of two rules — that en passant is optional, and that a turn
> change follows every move. A second model (Claude Opus 4.6, independently, twice, 100%
> agreement) confirmed the key is wrong, not the model. See [the wrong-key table](#wrong-key-the-six-broken-fixtures),
> [RESULTS.md](RESULTS.md), and the [finding it came from](data/submissions/claude-opus-4-6-chess-v0.1/FINDING.md).
>
> **This is not the same thing as `saturated`, and the two must not be confused.** A
> saturated protocol measured correctly and simply stopped separating models — it retires
> with its scores intact, because the scores were true. A wrong-key protocol never measured
> anything: a score against a wrong key means "agreed with the mistake," and publishing it
> as a capability number would be worse than publishing nothing. Chess v0.1 is retired, not
> saturated, and every score produced against the six broken fixtures is withdrawn along with
> the protocol — see [RESULTS.md](RESULTS.md).
>
> The fixtures are deliberately **not corrected in place**. They stay wrong in this file and
> in [`data/chess-benchmark-v0.1.json`](data/chess-benchmark-v0.1.json) because they are now
> a record of the mistake, not a live test. Fixing them belongs to protocol v0.2.
>
> A third, older reason this protocol could never have discriminated between strong models
> even with a correct key: every fixture rests on the same two en-passant positions, and the
> `state_tracking` and `interactive_play` families contain a single move each — neither
> measures a trajectory, whatever the family name promises. That defect is superseded by the
> wrong-key finding above, but it would have needed fixing regardless.

## Wrong key: the six broken fixtures

None of the fixtures below contain a king. They are not legal chess positions, and the
disagreement is not a chess subtlety — it follows directly from two rules the hand-written
judge got wrong: en passant is a right, not an obligation, so declining it does not make an
ordinary pawn push illegal; and a move always changes the side to move and, on black's move,
increments the full-move counter.

| Fixture | What the key says | What is correct | Why |
|---|---|---|---|
| `legality-white-illegal-forward` | `legal: false` for `e5e6` in `8/8/8/3pP3/8/8/8/8 w - d6 0 1` | `legal: true` | `e5e6` is an ordinary push to an empty square. En passant being available does not make declining it illegal. |
| `legality-black-illegal-forward` | `legal: false` for `e4e3` (mirrored position) | `legal: true` | Same reasoning, mirrored for black. |
| `state-white-ep` | expected FEN `8/8/3P4/8/8/8/8/8 w - - 0 1` after white plays `e5d6` | `8/8/3P4/8/8/8/8/8 b - - 0 1` | White just moved; it is black's turn. The key never flips the side to move. |
| `state-black-ep` | expected FEN `8/8/8/8/8/3p4/8/8 b - - 0 1` after black plays `e4d3` | `8/8/8/8/8/3p4/8/8 w - - 0 2` | Black just moved; it is white's turn, and the full-move counter increments after black moves. |
| `interactive-white-ep` | same wrong `expected_fen` as `state-white-ep` | same fix as `state-white-ep` | Uses the same broken expectation. |
| `interactive-black-ep` | same wrong `expected_fen` as `state-black-ep` | same fix as `state-black-ep` | Uses the same broken expectation. |

Root cause: every fixture position in this protocol omits both kings, so no fixture is a
legal chess position and no engine will load one. The project substituted hand-written move
and legality logic for an engine, and that hand-written logic encoded the same two
misunderstandings listed above. Any evaluated model that also believes en passant is
optional and that turns alternate — that is, any model that knows the rules of chess — loses
points on these six fixtures for being right. Gemini 3.6 Flash scored 36/36 on the withdrawn
run because it agreed with the wrong key, not because it played correctly.

This is the first protocol of the Game Codex Observatory. It measures a model or agent through a fixed interface and reports a capability profile, not a single rank.

## Response contract

The fields a submission must contain are declared once, in
[`data/chess-response-contract-v0.1.json`](data/chess-response-contract-v0.1.json). The
evaluator, the reference baseline, and the prompt given to an evaluated model are all derived
from that file. Restating the shape anywhere else creates a second contract, and on
2026-08-12 a second contract cost a compliant model half its score.

## Task families

Chess v0.1 currently contains 12 fixtures across five task families, with white/black
symmetry and deliberately illegal controls. The fixture count is part of the protocol.

| ID | Task | Deterministic verdict |
|---|---|---|
| `legality` | choose a move from a position | legal / illegal / unparsable |
| `state_tracking` | reconstruct a board after a move sequence | exact state match |
| `tactics` | choose the best move from a fixed position | engine-verified move class |
| `explanation` | explain the chosen move | grounded against board and verdict |
| `interactive_play` | maintain a legal state over multiple turns | legal trajectory and completion |

## Run protocol

Every task is run at least three times with the same protocol and independent seeds where sampling exists. The report preserves all trials. `incomplete` means timeout, unparsable action, or unfinished interaction; it is not silently converted to `loss` or `pass`.

The submission records the model snapshot, provider, prompt, tools, protocol version, date, seed or sampling configuration, trial count, evaluator version, cost, latency, raw trajectory, and deterministic verdict.

The deterministic evaluator was runnable without credentials:

```bash
npm run benchmark:chess   # RETIRED — see below before running this
```

**This command still works and its output is meaningless.** It scores a submission against the
answer key retired on 2026-08-12, so a perfect 36/36 means "agreed with the wrong answer in six
of twelve fixtures". The command is left in place rather than deleted for the same reason the
fixtures are: this file is a record of the error. Do not use it to evaluate anything.

The checked-in reference baseline was a protocol fixture, not a model result:
3 independent trials × 12 fixtures = 36 deterministic verdicts. It proved that the evaluator
and result shape worked before any provider was measured — and, as it turned out, proved
nothing about whether the key was right, because the baseline was built from that same key. A
control that shares the assumption it is meant to test confirms nothing.

## Metrics

The primary profile contains legal-action rate, exact state-tracking rate, goal success, consistency across trials, cost, latency, confidence calibration, and explanation grounding. A composite score is intentionally not the primary result: a model that wins while making illegal moves must remain visibly different from a reliable model.

## Saturation rule

When a task reaches a ceiling and no longer separates models, it remains in the historical record but is marked `saturated`, and its scores stay intact — they measured something true and simply stopped discriminating. This does not apply to Chess v0.1: see [retirement](#wrong-key-the-six-broken-fixtures) above. A protocol scored against a wrong answer key is marked `retired` instead, and the scores it produced are withdrawn with it, because they measured agreement with an error rather than a capability.
