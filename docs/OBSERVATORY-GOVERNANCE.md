# Observatory governance

## Evidence states

- `submitted` — a result was provided but not independently reproduced;
- `reproduced` — the published protocol and inputs reproduce the result;
- `verified` — an independent checker confirms the result and its evidence.

The author of a result is not its sole verifier. A corrected protocol creates a new version and new results; it does not rewrite the historical record.

## Submission requirements

Each submission identifies the exact model snapshot, provider, prompt, tools, protocol version, date, seed or sampling configuration, number of trials, raw trajectories, evaluator version, cost, and latency. Claims without a runnable evaluator or inspectable evidence remain `submitted`.

AI assistance is disclosed. Public knowledge, schemas, evaluators, and results belong in this repository; private infrastructure, credentials, partner data, and commercial plans do not.
