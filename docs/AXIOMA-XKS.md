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

Seven fields are required in every capsule of every profile:

| Field | What it carries | Why it is mandatory |
|---|---|---|
| `xks_version` | version of *this format* | so a reader can refuse what it does not understand instead of guessing. Not the version of the thing described — see `module-passport.version` |
| `id` | stable identifier | never reused for a different subject; a citation must stay pointed at one thing |
| `profile` | which profile's rules apply | a reader must not have to infer this from which optional fields happen to be present |
| `claim` | one assertion | one per capsule — a capsule asserting two things cannot be retracted by halves |
| `provenance` | author and date | an assertion without an author can only be believed, not audited |
| `confidence` | number, 0..1 | declared, never inferred by the reader from fluency. The author's stated belief, **not** a calibrated probability, and it must not be read as one |
| `decay` | expiry **and** trigger | a claim with no expiry silently becomes a claim about the past |

`provenance` and `decay` are objects, not strings, and their required sub-fields are declared
in the schema: `provenance.claim.source` and `.timestamp`, `decay.check_after` and `.trigger`.
A file missing any of this is not an Axioma-XKS capsule, whatever else it contains.

## Profiles

The spine is shared; what sits on top of it depends on what is being described. Which profile
applies is stated by the capsule, in `profile` — never guessed by the reader.

**`knowledge-object`** — a claim about the world, published for people and machines at once.
Requires a `domain` and a `layers` object containing six layers, all mandatory: an `answer` a
person can read, `evidence` an auditor can follow, a `model` that can be reasoned with, a
`play` scene a learner can act in, a `quiz` that tests understanding, and a `machine` layer
carrying a runnable criterion. The six are keys inside `layers`, not top-level fields.

Two rules do the real work here. `evidence` must carry a reference that resolves *and* a quote
that is verbatim present at it — the presence of a non-empty string is not evidence, and this
project shipped a green test for a month on exactly that confusion. `machine` must carry
`local_check`, a command satisfying the execution contract the schema now declares
(`machine_execution_contract` in `data/axioma-xks-spine-v1.json`, added in 1.2.0): a `node`
command, run from the repository root, no dependency, no network, exit 0 means the claim
still holds. What that contract does **not** yet cover is set out under
[Known gaps](#known-gaps) — it closes the gap for node commands inside this repository, not
for an execution environment in general.

**`module-passport`** — a capsule describing a living software module. Requires `title`,
`version`, `lifecycle`, and `kind`; `components` and `tests` are optional manifests of the
files it is made of and the verifiers that check it. Its `version` must equal the version the
module reports to its users — two version numbers for one module is the same defect as two
contracts — and it is a different field from `xks_version`, which versions the capsule format.

## Closed vocabularies, declared extensions

**Vocabularies belong to a profile, not to the format.** A profile declares which vocabularies
it closes and what values they admit; a validator rejects a value outside the vocabulary of the
capsule's *declared* profile. `lifecycle` is shared across profiles. `kind` and `layer` belong
to `module-passport`; `knowledge-corpus` has its own `layer`.

That scoping is a fix, not a refinement, and it was paid for. The first published version of
this document named two closed vocabularies while the private contract it was derived from
names three — `layer`, with the values `core / face / vault`, was dropped in publication and
nobody noticed for a day. Meanwhile an adjacent corpus by the same author had been blocked
since 2026-08-02 for exactly that reason: it is a body of knowledge, it has no code modules,
it has nothing to put in that enum, and the published spec gave it no way to say so. A format
that forces a corpus to describe itself in the vocabulary of a codebase is telling it to lie
or to fork.

This is not strictness for its own sake. An open vocabulary makes conformance a matter of
taste, and two independent readers of the same corpus stop being comparable — which destroys
the only property that made the format worth having.

Extension is still allowed, and is expected. The rule is that **an extension is declared in
the capsule, never adopted silently**: `lifecycle_profile` names the profile whose vocabulary
the capsule uses, and its absence means the base one. A reader that meets a profile it does
not know must say *"unknown vocabulary"* — not *"invalid capsule"*. Otherwise an extension is
indistinguishable from corruption, and the format punishes precisely the users who grow.

That obligation is empty unless it says what the capsule's *status* then is, so: the capsule
is conformant to the spine and to its profile's structural rules, and exactly one field — the
one governed by the unknown vocabulary — is unverified. A validator reports this as a **third
outcome**, distinct from both pass and fail, and must not let the capsule reach "fully
verified" while it stands. Two outcomes cannot carry three states: collapse it into failure
and extension dies, collapse it into success and a hallucinated profile name walks straight
through validation.

The mechanism covers **any profile-scoped vocabulary**, named `<vocabulary>_profile` —
`lifecycle_profile`, `layer_profile`, and so on. Until 1.3.0 only `lifecycle` could be
extended, which left a corpus needing a different `layer` with no path but a fork.

The worked example is real, not hypothetical. An adjacent corpus by the same author keeps a
seventh lifecycle value, `historical`, because a withdrawn topic in a knowledge map has to
read differently from a deprecated software module: knowledge does not die the way code does.
A format that cannot express that fork hands an outside reader a contradiction as the first
thing they see.

## Retraction

A published capsule is never edited to hide an error, and never deleted. It is marked
withdrawn, with the reason and a pointer to what replaces it.

Concretely: `evidence_status` becomes `withdrawn` and a `withdrawn` object carries `date`,
`reason`, and `superseded_by`. The claim, the evidence, and the original identifier stay
exactly as published — a retraction that edits the claim is not a retraction.

A corpus that quietly revises itself cannot be cited, because the citation would point at
whatever the text happens to say today. Retraction is what makes a record load-bearing, and
it is cheap to promise and expensive to keep.

## What this format did *not* catch in its own author

The first version of this section said the errors below were things "the format caught". The
first external reviewer — a model from another vendor, reading this cold — called that
self-congratulation wearing the clothes of honesty, and was right. The correction stands here
rather than being quietly swapped in, because that is the behaviour the rest of this document
demands.

Here is the accurate account. Four errors, all public, all in this repository's history, and
**not one of them was caught by the capsule format.**

**A benchmark answer key wrong in half its fixtures.** Six of twelve chess fixtures asserted
the wrong answer, because none of the positions contained a king and hand-written move logic
stood in for an engine, reproducing its author's misunderstanding of two rules. *Caught by:*
a second model, from another vendor, disagreeing with the key twice in a row. The format
played no part. See [the retirement notice](CHESS-BENCHMARK-V0.1.md) and
[the finding](data/submissions/claude-opus-4-6-chess-v0.1/FINDING.md).

**A published result that understated another vendor's model by half.** The prompt given to
an evaluated model specified one response shape; the evaluator read another. *Caught by:* a
person opening both files and comparing them. The format played no part. See
[RESULTS.md](RESULTS.md).

**One chess position recorded three times, three different ways.** *Caught by:* the same
manual investigation. If anything, this is an error the format's own one-claim-one-place
principle would have prevented had it been applied — its absence caused the error rather than
its presence catching it.

**A citation stitched from three editions** — a quote from the 2023 rules, an article number
from 2009, a link to the 2009 PDF. *Caught by:* a test that fetches the reference and looks
for the quote in the response body. That test is the closest thing here to a win, and it is a
test, not a format.

So what does the format actually contribute? One thing, and it is smaller than the earlier
version claimed but not nothing: **it makes the fields exist so a check can be written against
them.** A capsule with no `evidence.ref` gives a test nothing to fetch; a claim with no
`decay.check_after` gives a scheduler no date to fire on; a corpus with no declared
`confidence` leaves a reader inferring certainty from fluency. The format does not do the
checking. It removes the excuse that there was nothing to check.

Two of these errors were found only because a **different model** disagreed, which is worth
more than any field in the schema — and is exactly how this section came to be rewritten.

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

## Known gaps

Named here rather than left for a reader to find. A specification that hides its own holes is
the thing this project keeps catching in other people's work and in its own. All six were
raised by the first external review, and none is fixed in v1.

**The `machine` layer's execution environment is only partly specified.** Schema 1.2.0 adds
`machine_execution_contract`: `local_check` is a `node` command, run from the repository root,
with no dependency and no network, where exit 0 means the claim holds and nonzero means it does
not — and `selftest.mjs` (`C-08`) now runs it for every capsule instead of checking that the
field exists. That closes the gap for **this repository's own capsules**, read by someone
willing to run node in this checkout. It does not specify a runtime for any other environment
(shell, Python, a container, a remote endpoint), resource or time limits, a parameter-passing
convention for criteria that need input, or how a reader who does not trust running an
arbitrary script from a corpus it is auditing is supposed to get the same answer without
executing untrusted code. The claim that this format makes "still true" automatically
answerable is earned narrowly, not as a property of the format in general.

**`evidence.ref` has no resolution protocol.** The spec does not say whether `ref` is a URL, a
DOI, a git object, or a path, nor how to handle redirects, auth, paywalls, client-rendered
pages, or a source that moves. The reference implementation handles HTTP(S) and reports an
unreachable source as *unverified* rather than *broken*; that is one implementation's choice,
not a rule of the format.

**No integrity binding.** A capsule carries no digest or signature over its own content. A
reader cannot distinguish a capsule altered after publication from one that was not.
Provenance names an author; it does not bind the bytes.

**Nobody is named as the authority over profiles.** Nothing says who may declare a new profile
or where the declaration is published. Two corpora that each invent a `knowledge-corpus`
profile with different vocabularies would both be conformant and mutually unreadable — which is
the exact incomparability that closed vocabularies exist to prevent, displaced one level up
rather than solved.

**This schema is not a schema.** `axioma-xks-spine-v1.json` is a description with normative
prose inside it, not JSON Schema. It cannot be handed to an off-the-shelf validator, so every
implementation writes its own reader — which is precisely the situation that lets two readers
drift apart.

**`knowledge-object` is coupled to teaching.** Making `play` and `quiz` mandatory suits
knowledge somebody practises and fits badly around a dataset or an operational fact. Filling
those layers with placeholders to satisfy the schema would be a stub, and stubs are what this
project calls lying about readiness.

## Conformance

`node selftest.mjs` checks, among other things, that every capsule published here satisfies the
spine and its declared profile, that every `evidence.ref` resolves and its quote is verbatim
present at the source, and that no generated artifact has been hand-edited. Network checks that
cannot run report `SKIPPED` — a run with a skipped check is incomplete, not green.

## Review history

**2026-08-12 — first external review.** Gemini 3.6 Flash, cold read, no access to this project
beyond the two published files. Seven questions, seven answers, all critical. It found the
prose and the schema disagreeing in three places, an unhandled ambiguity in the extension
rule, six unstated gaps, and a section that flattered its author. Schema v1.1 and this
revision of the prose are the response; the review itself is preserved unedited at
[`reviews/2026-08-12-gemini-3-6-flash.md`](reviews/2026-08-12-gemini-3-6-flash.md),
alongside [the prompt it answered](reviews/2026-08-12-prompt.md) — a review without its
prompt cannot be told apart from a review that was steered.

Two findings deserve naming, because they land on this document's own principle. The spine had
**no field declaring which profile applied** — so this project's validator guessed
`knowledge-object` for every capsule, which is a reader inferring what the author should have
stated. And that validator was enforcing sub-fields of `decay` the schema never declared:
**the test knew more about the format than the specification did.** That is the two-statements
defect this document exists to prevent, found inside the document itself, by a stranger,
within hours of publication.

## Status and citation

This specification is `draft`. It describes a format in use, not a proposal: the capsules in
this repository are its worked examples and are validated against it on every run.

Cite the repository via [`CITATION.cff`](../CITATION.cff). Retracted results keep their
identifiers.
