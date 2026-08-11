# Results

This page is the human-readable index of the Game Codex Observatory. The machine-readable
registry is [`data/RESULTS.json`](data/RESULTS.json); historical entries are append-only.

## Chess v0.1

| Run | Model/provider | Trials | Fixtures | Passed | Failed | Incomplete | Status |
|---|---|---:|---:|---:|---:|---:|---|
| 2026-08-11 reference control | deterministic fixture / no provider | 3 | 12 | 36 | 0 | 0 | protocol check, not a model result |

### Capability profile

The control run confirms that the protocol and evaluator agree across:

- legal and deliberately illegal moves;
- white/black en-passant symmetry;
- board-state reconstruction;
- tactical and explanation fields;
- multi-turn interactive trajectories.

It does not measure an AI provider. No model score is claimed until a submission includes
the model snapshot, provider, prompt, tools, sampling configuration, raw responses, cost,
latency, and the deterministic verdict produced by the pinned evaluator.

## Reading the numbers

`passed`, `failed`, and `incomplete` are kept separate. A timeout, unparsable response, or
unfinished interaction is not silently converted into a loss or a pass. A future model
entry should be compared by capability profile and by trial history, not by one composite
number.

## Next public result

The next milestone is the first provider-backed Chess v0.1 submission. Until its raw
trajectory and metadata are published, the honest public state is: protocol verified,
provider performance unmeasured.
