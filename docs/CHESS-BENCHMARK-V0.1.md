# Chess Benchmark v0.1

This is the first protocol of the Game Codex Observatory. It measures a model or agent through a fixed interface and reports a capability profile, not a single rank.

## Task families

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

The deterministic evaluator is runnable without credentials:

```bash
npm run benchmark:chess
```

The checked-in reference baseline is a protocol fixture, not a model result. It proves that the evaluator and result shape work before any provider is measured.

## Metrics

The primary profile contains legal-action rate, exact state-tracking rate, goal success, consistency across trials, cost, latency, confidence calibration, and explanation grounding. A composite score is intentionally not the primary result: a model that wins while making illegal moves must remain visibly different from a reliable model.

## Saturation rule

When a task reaches a ceiling and no longer separates models, it remains in the historical record but is marked `saturated`. New positions, out-of-distribution states, or a new task family get a new protocol version; old scores are not rewritten.
