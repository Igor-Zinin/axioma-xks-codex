Model snapshot: Gemini 3.6 Flash
Date and time: 2026-08-12 13:22:06 UTC
Internet access: true

# Cold Review of Axioma-XKS Specification

## 1. Where does it promise more than it delivers?

* **`AXIOMA-XKS.md:15-19`**:
  > "A capsule is a unit of knowledge that carries, in the same file as the claim:
  > - **who asserted it and when** — so it can be audited rather than believed;
  > - **what evidence supports it** — a resolvable reference, and a quote that is really there;
  > - **how confident the author is** — declared as a number, not implied by tone;
  > - **when it must be re-checked** — an expiry and a trigger;
  > - **a criterion a machine can run** — so "still true" is a question with an answer."
  
  **Over-promise**: It promises an automated, deterministic check for "still true" embedded inside a single capsule file.
  **What would have to exist**: For a machine criterion to make "still true" an actionable question with a real answer, the specification would need to define an execution environment, runtime semantics, language bindings, sandboxing security rules, and deterministic output structures for the `machine` layer. Neither the prose nor `axioma-xks-spine-v1.json` defines what an executable criterion actually is (e.g., shell script, WASM binary, jq query, HTTP endpoint, container image), how parameters are passed, or how dependencies are managed. Without an execution spec, a machine can only verify the *presence* of the string containing the criterion, not *run* it.

* **`AXIOMA-XKS.md:38`**:
  > "`evidence` must carry a reference that resolves *and* a quote that is verbatim present at it"
  
  **Over-promise**: Promises deterministic, reproducible, offline/online automated resolution of evidence sources.
  **What would have to exist**: A resolution protocol specification. The spec provides zero schema or syntax rules for `evidence.ref`. It does not specify whether `ref` is a URL, DOI, ISBN, git commit hash, file system path, or IPFS CID. If `ref` is an HTTP URL, there are no specs for handling auth, dynamic JS rendering, paywalls, HTTP 3xx/4xx/5xx status codes, rate-limiting, or content negotiation. Without a URI protocol standard and fallback archival scheme, automated verbatim quote matching is impossible across arbitrary web targets.

---

## 2. Is the spine right?

### Mandatory Fields Declared (`AXIOMA-XKS.md:25-34`):
`xks_version`, `id`, `claim`, `provenance`, `confidence`, `decay`

### Is any of them unnecessary?
* **None of the six are inherently useless**, but **`confidence` is structurally weak**. Declaring confidence as a float `0..1` without an objective calibration standard or scoring metric reduces it to arbitrary subjective sentiment. However, as an auditing metadata tag, it serves the author's declared purpose.

### What is missing that an auditor would need and cannot reconstruct?

1. **Explicit Hash / Integrity Signature of Content**:
   * An auditor inspecting a claim cannot verify if the capsule itself was modified post-issuance without an cryptographic digest (e.g. SHA-256) or digital signature (e.g., Ed25519) of the payload bound to `provenance`.
2. **Schema Type / Profile Identifier in Spine**:
   * The spine required fields (`AXIOMA-XKS.md:33`, `spine.required` in JSON) **do not include a profile declaration field** (e.g. `profile` or `$schema`). An auditor parsing a bare capsule against the spine cannot determine which profile rules (`knowledge-object`, `module-passport`, or a custom extension) apply to the capsule without out-of-band inspection or inferring it from extra fields.
3. **Structured Sub-fields for Provenance and Decay**:
   * `provenance` and `decay` are listed as top-level required fields, but neither the prose nor the JSON schema defines their internal structure (e.g. whether `provenance` is an object `{ "author": "...", "date": "..." }` or a plain string). An auditor cannot machine-parse dates or author identities deterministically without standardized sub-key definitions.

---

## 3. Does the extension rule actually work?

* **`AXIOMA-XKS.md:46-51`**:
  > "Extension is still allowed, and is expected. The rule is that **an extension is declared in the capsule, never adopted silently**: `lifecycle_profile` names the profile whose vocabulary the capsule uses, and its absence means the base one. A reader that meets a profile it does not know must say *"unknown vocabulary"* — not *"invalid capsule"*. Otherwise an extension is indistinguishable from corruption, and the format punishes precisely the users who grow."

* **Objection / Flaw**: **No, the extension rule creates an unhandled ambiguity hole.**
  1. **Status Code vs Conformance Result Conflation**: The specification mandates a specific string/error outcome ("unknown vocabulary" instead of "invalid capsule"), but does not define how a machine validator signals this distinction in programmatic API returns, exit codes, or JSON schemas.
  2. **Indeterminate Conformance State**: If a reader encounters an `unknown vocabulary`, is the capsule considered **conformant-pending-vocabulary**, or **non-conformant**? The spec does not say. If a consumer pipeline treats "unknown vocabulary" as a non-fatal warning, a broken or corrupted file with a hallucinated `lifecycle_profile` string will bypass validation checks. If the pipeline treats it as an error, then "unknown vocabulary" is semantically identical to "invalid capsule" in practice, invalidating the promised benefit of extensions.
  3. **Scoping Ambiguity**: `lifecycle_profile` only addresses vocabulary extension for the `lifecycle` enum. It provides no mechanism for extending `kind`, adding new mandatory profile layers, or creating custom profile types beyond `knowledge-object` and `module-passport`.

---

## 4. Read the section "What this format caught in its own author"

* **Objection to line `AXIOMA-XKS.md:61-62`**:
  > "The honest argument for a format about decay is not a manifesto. It is the list of things it caught in the corpus of the person proposing it — all of it public, all of it in this repository's history."

* **Critique**: **It reads predominantly as self-congratulation wearing the clothes of honesty.**
  * The section frames past technical failures (broken chess move logic, misread JSON output schemas, copy-pasted citations) as triumphs of the Axioma-XKS design.
  * **The logical fallacy**: The author claims the format "caught" these bugs in lines 61–77. But line 77 explicitly admits: *"The format did not prevent them. It made them findable, and it required saying so out loud afterwards."* In reality, basic unit testing, CI schema validation, or manual code review caught these errors—not the capsule specification itself.
  * By attributing standard bug-fixing and post-mortem disclosures to the format's intrinsic virtue, the author turns a public error log into a subtle marketing narrative for their spec.

---

## 5. Comprehensibility

### First-Reading Ambiguities & Re-read Points:

1. **`AXIOMA-XKS.md:37-41` vs `axioma-xks-spine-v1.json:18-28`**:
   * *Confusion*: `AXIOMA-XKS.md:37` states that `knowledge-object` has *"Six layers, all mandatory: an answer a person can read, evidence an auditor can follow, a model that can be reasoned with, a play scene a learner can act in, a quiz that tests understanding, and a machine layer carrying an executable criterion."*
   * *Re-read required*: On first reading, it is unclear whether these six layers are top-level JSON keys, nested sub-objects under a `layers` key, or array items. Looking at the JSON schema (`"required": ["domain", "layers"]`), one discovers `layers` is a nested container, which is omitted in the prose description.

2. **`AXIOMA-XKS.md:43`**:
   * *Confusion*: *"Its `version` must equal the version the module reports to its users; two version numbers for one module is the same defect as two contracts."*
   * *Re-read required*: Does `version` replace `xks_version` or exist alongside it? Re-reading the spine rules reveals `xks_version` is format-level while `version` is module-level, but naming them so closely creates immediate cognitive friction.

3. **`AXIOMA-XKS.md:58-60`**:
   * *Confusion*: *"Retraction is what makes a record load-bearing, and it is cheap to promise and expensive to keep."*
   * *Re-read required*: The prose explains the philosophy of withdrawal, but fails to state *how* a capsule is marked withdrawn in the data model (is it a boolean flag, a lifecycle state, or an overarching status field?).

---

## 6. Do prose and schema agree?

They do **not** agree in several specific places:

1. **`AXIOMA-XKS.md:37` vs `axioma-xks-spine-v1.json:19` (`knowledge-object` required fields)**
   * **Prose (`AXIOMA-XKS.md:37`)**: States that `knowledge-object` requires six layers (`answer`, `evidence`, `model`, `play`, `quiz`, `machine`).
   * **Schema (`axioma-xks-spine-v1.json:19`)**: Declares `"required": ["domain", "layers"]`. The prose **never mentions the required `domain` field** anywhere in `AXIOMA-XKS.md`.

2. **`AXIOMA-XKS.md:42-44` vs `axioma-xks-spine-v1.json:28` (`module-passport` required fields)**
   * **Prose (`AXIOMA-XKS.md:42-44`)**: States: *"A capsule describing a living software module: what it is, which files it is made of, and which tests verify it. Its `version` must equal the version the module reports to its users..."*
   * **Schema (`axioma-xks-spine-v1.json:28`)**: Declares `"required": ["title", "version", "lifecycle", "kind"]`. The prose **completely omits `title`, `lifecycle`, and `kind`** when describing the module passport requirements, and fails to clarify that `components` and `tests` are optional/field-rules rather than mandatory root keys.

3. **`AXIOMA-XKS.md:45-51` vs `axioma-xks-spine-v1.json:39-44` (Vocabulary scoping)**
   * **Prose (`AXIOMA-XKS.md:45`)**: *" `lifecycle` and `kind` are closed in v1."*
   * **Schema (`axioma-xks-spine-v1.json:41`)**: Under `"extension"`, the schema specifies `lifecycle_profile` as the sole extension mechanism for `lifecycle`. There is **no mechanism or property provided in the schema to extend `kind`**, contradicting the prose implication that closed vocabularies share a common profile extension rule.

---

## 7. What would make you NOT cite this?

1. **Incomplete Specification / Missing Formal Schema**:
   * `axioma-xks-spine-v1.json` is a custom meta-description file with natural language rules (`"MUST carry at least one executable criterion"`), not a standard machine-enforceable schema (such as JSON Schema Draft 2020-12 or OpenAPI 3.1). A developer cannot plug this JSON file into an off-the-shelf JSON Schema validator to validate capsules.

2. **Unenforceable Core Contract ("Machine Criterion")**:
   * The primary value proposition of Axioma-XKS over standard markdown notes or JSON-LD is the runnable `machine` criterion. Because the spec provides no execution interface, runtime specification, or sandbox boundary, the standard collapses into an informal conventions list.

3. **Tightly-Coupled Domain Assumptions**:
   * The mandatory profile layers (`play` scenes for learners, `quiz` for testing) tightly couple a general-purpose knowledge capsule format to specific educational/interactive UI applications. This makes `knowledge-object` unsuited for general enterprise software metadata, scientific datasets, or technical documentation without creating custom profiles.
