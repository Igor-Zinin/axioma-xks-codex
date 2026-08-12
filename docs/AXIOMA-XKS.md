# Axioma-XKS — a capsule format for knowledge that can be audited

> Machine-readable half: [`data/axioma-xks-spine-v1.json`](data/axioma-xks-spine-v1.json).
> This document explains; that file decides. Where they disagree, the file is right and this
> document is a bug.

## The problem it exists for

Knowledge written down for machines rots in a way that is hard to see. A sentence that was
true when written stays legible, stays confident, and stays wrong. Nothing about its
appearance changes when the world moves underneath it. The failure mode is not a broken link
or a parse error — those are loud. It is a document that continues to teach, fluently,
something that stopped being so.

Retrieval systems make this worse rather than better: they select for text that *looks*
authoritative and carries no way to ask how old it is, who asserted it, or what would have
to happen for it to stop being true.

Axioma-XKS is a small answer to that. A capsule is a unit of knowledge that carries, in the
same file as the claim:

- **who asserted it and when** — so it can be audited rather than believed;
- **what evidence supports it** — a resolvable reference, and a quote that is really there;
- **how confident the author is** — declared as a number, not implied by tone;
- **when it must be re-checked** — an expiry and a trigger;
- **a criterion a machine can run** — so "still true" is a question with an answer.

None of that is novel on its own. What the format insists on is that all of it lives *in the
capsule*, not in a wiki page beside it, not in the author's memory, and not in a second file
that will drift.

## The spine

Six fields are required in every capsule of every profile:

| Field | What it carries | Why it is mandatory |
|---|---|---|
| `xks_version` | format version | so a reader can refuse what it does not understand instead of guessing |
| `id` | stable identifier | never reused for a different subject; a citation must stay pointed at one thing |
| `claim` | one assertion | one per capsule — a capsule asserting two things cannot be retracted by halves |
| `provenance` | author and date | an assertion without an author can only be believed, not audited |
| `confidence` | number, 0..1 | declared, never inferred by the reader from fluency |
| `decay` | expiry and trigger | a claim with no expiry silently becomes a claim about the past |

A file missing any of these is not an Axioma-XKS capsule, whatever else it contains.

## Profiles

The spine is shared; what sits on top of it depends on what is being described.

**`knowledge-object`** — a claim about the world, published for people and machines at once.
Six layers, all mandatory: an `answer` a person can read, `evidence` an auditor can follow, a
`model` that can be reasoned with, a `play` scene a learner can act in, a `quiz` that tests
understanding, and a `machine` layer carrying an executable criterion.

Two rules do the real work here. `evidence` must carry a reference that resolves *and* a quote
that is verbatim present at it — the presence of a non-empty string is not evidence, and this
project shipped a green test for a month on exactly that confusion. `machine` must carry a
criterion someone can actually run; a criterion nobody can run is a promise wearing the
clothes of a check.

**`module-passport`** — a capsule describing a living software module: what it is, which files
it is made of, and which tests verify it. Its `version` must equal the version the module
reports to its users; two version numbers for one module is the same defect as two contracts.

## Closed vocabularies, declared extensions

`lifecycle` and `kind` are closed in v1. A validator rejects a value outside the vocabulary.

This is not strictness for its own sake. An open vocabulary makes conformance a matter of
taste, and two independent readers of the same corpus stop being comparable — which destroys
the only property that made the format worth having.

Extension is still allowed, and is expected. The rule is that **an extension is declared in
the capsule, never adopted silently**: `lifecycle_profile` names the profile whose vocabulary
the capsule uses, and its absence means the base one. A reader that meets a profile it does
not know must say *"unknown vocabulary"* — not *"invalid capsule"*. Otherwise an extension is
indistinguishable from corruption, and the format punishes precisely the users who grow.

The worked example is real, not hypothetical. An adjacent corpus by the same author keeps a
seventh lifecycle value, `historical`, because a withdrawn topic in a knowledge map has to
read differently from a deprecated software module: knowledge does not die the way code does.
A format that cannot express that fork hands an outside reader a contradiction as the first
thing they see.

## Retraction

A published capsule is never edited to hide an error, and never deleted. It is marked
withdrawn, with the reason and a pointer to what replaces it.

A corpus that quietly revises itself cannot be cited, because the citation would point at
whatever the text happens to say today. Retraction is what makes a record load-bearing, and
it is cheap to promise and expensive to keep.

## What this format caught in its own author

The honest argument for a format about decay is not a manifesto. It is the list of things it
caught in the corpus of the person proposing it — all of it public, all of it in this
repository's history.

**A benchmark answer key that was wrong in half its fixtures.** Six of twelve chess fixtures
asserted the wrong answer. The root cause was structural: none of the positions contained a
king, so none of them were legal chess positions and no engine would load one. Hand-written
move logic stood in for an engine, and reproduced its author's own misunderstanding of two
rules. The result was a benchmark that *punished knowledge* — a model that knew the rules
scored lower. See [the retirement notice](CHESS-BENCHMARK-V0.1.md) and
[the finding](data/submissions/claude-opus-4-6-chess-v0.1/FINDING.md).

**A published result that understated another vendor's model by half.** The prompt handed to
an evaluated model specified one response shape; the evaluator read another. The model complied
perfectly and was published at 18/36 with the failure attributed to it. Two statements of one
contract, and nothing comparing them. See [RESULTS.md](RESULTS.md).

**One chess position recorded three times, three different ways.** The interactive scene of the
flagship capsule placed a pawn on the wrong square while the sentence beside it named the right
one, and the benchmark's expectation disagreed with both.

**A citation stitched from three editions.** A quote from the 2023 rules, an article number
from 2009, and a link to the 2009 PDF — passing a green test, because the test checked that the
field was non-empty rather than that the quote was there.

Every one of these is exactly what the six spine fields exist to make visible: a claim whose
evidence nobody followed, a confidence nobody declared, an expiry nobody set. The format did not
prevent them. It made them findable, and it required saying so out loud afterwards.

## Conformance

`node selftest.mjs` checks, among other things, that every capsule published here satisfies the
spine and its declared profile, that every `evidence.ref` resolves and its quote is verbatim
present at the source, and that no generated artifact has been hand-edited. Network checks that
cannot run report `SKIPPED` — a run with a skipped check is incomplete, not green.

## Status and citation

This specification is `draft`. It describes a format in use, not a proposal: the capsules in
this repository are its worked examples and are validated against it on every run.

Cite the repository via [`CITATION.cff`](../CITATION.cff). Retracted results keep their
identifiers.
