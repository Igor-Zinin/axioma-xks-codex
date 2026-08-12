# Submit a Chess v0.1 result

The Observatory accepts results as JSON trajectories. The evaluator never calls a model: the submitter runs the model separately, records its outputs, and submits the resulting file for deterministic checking.

## 1. Prepare a submission

The response shape is declared in exactly one place: [`chess-response-contract-v0.1.json`](data/chess-response-contract-v0.1.json). Do not restate it in your own words — derive your prompt from that file. Every fixture gets one object carrying every field, with `null` where a field does not apply:

```json
{
  "game": "chess",
  "protocol": "chess-v0.1",
  "model": "provider/model-version",
  "provider": "provider-name",
  "date": "2026-08-11T00:00:00Z",
  "trials": [{"responses": {"legality-white-ep": {
    "move": "e5d6", "legal": true, "state_fen": null, "explanation": null, "completed": true
  }}}]
}
```

The complete task set is in [`chess-benchmark-v0.1.json`](data/chess-benchmark-v0.1.json). Three independent trials are the minimum for a comparable submission. Include the prompt verbatim, tools, sampling settings, per-trial start and end timestamps, cost, latency, and raw trajectories in the accompanying report; do not silently omit incomplete attempts.

**The prompt is part of the evidence, not a working note.** Submit it unedited. Without it, a low score cannot be told apart from a contract the model was never shown — which is exactly how the first published provider result came to understate a compliant model by half.

## 2. Run the evaluator

```bash
node scripts/chess-evaluator.mjs \
  --input path/to/submission.json \
  --output path/to/result.json
```

The evaluator returns `pass`, `fail`, `contract_violation`, or `incomplete` per task and produces a result envelope matching [`RESULT-SCHEMA.json`](RESULT-SCHEMA.json). A submission is `submitted` until an independent run reproduces it; only then can it become `reproduced` or `verified`.

## 3. Open a pull request

Add the result JSON and report to a pull request. Do not edit an old result. A changed model snapshot or protocol creates a new result. The maintainer checks the evaluator version, raw trajectories, provenance, and independent reproduction before changing the evidence status.
