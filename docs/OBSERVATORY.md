# Game Codex Observatory

Game Codex Observatory is an open record of how AI capabilities change in formal game worlds.

It is not a single leaderboard. Each result records the game, task, model snapshot, protocol version, raw trajectory, deterministic verdict, uncertainty, cost, latency, and date. Historical results are append-only: a protocol correction creates a new result rather than rewriting an old one.

## First target: Chess v0.1

Chess v0.1 covers five separable abilities:

1. legality — produce only legal moves;
2. state tracking — reconstruct the board after a move sequence;
3. tactical choice — select a move against a fixed position;
4. explanation grounding — explain the selected move without contradicting the verified board;
5. interactive play — maintain legal state over multiple turns.

Every task is independently repeated. A result is incomplete when the agent times out, produces an unparsable action, or cannot finish the protocol; incomplete is not silently converted into a loss or a pass.

## What we borrow

- dynamic interaction and saturation resistance from [LLM CHESS](https://arxiv.org/abs/2512.01992);
- capability categories from [ChessQA](https://arxiv.org/abs/2510.23948);
- out-of-distribution state tracking from [Chess-World-Model](https://arxiv.org/abs/2605.30100);
- repeated-trial discipline from [Claw-Eval](https://github.com/claw-eval/claw-eval);
- transparent, reproducible evaluation practice from [HELM](https://github.com/stanford-crfm/helm).

These projects are neighbours and references, not claims of partnership or endorsement.

## What makes this project different

The primary output is a capability profile and its change over time, not one composite rank. The central question is: which failure mode stopped distinguishing models, and which one remained?

## First recorded result

The [Chess v0.1 reference baseline](data/chess-reference-result-v0.1.json) is a
deterministic control run: 3 trials × 5 tasks, 15/15 passed. It is not a model
claim. Its purpose is to prove that the protocol, evaluator, and result schema
agree before provider-backed model submissions are accepted.

The public `chess-benchmark` GitHub Actions workflow reruns the evaluator,
baseline, and saved-result invariants on every push and pull request with
read-only repository permissions.
