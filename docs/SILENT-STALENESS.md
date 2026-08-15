# Silent staleness: five cases, and what actually caught each one

> A working note, not a product page. Nothing here requires adopting the
> [Axioma-XKS format](AXIOMA-XKS.md) — the cases are ordinary and the detectors are cheap.

A knowledge base does not tell you it has gone stale. Latency stays flat, retrieval returns
something, faithfulness scores well, and the system answers fluently — until it confidently
states something that stopped being true months ago. Across 143 enterprise RAG deployments,
73% hit a critical failure in the first quarter of production and **41% of those failures were
invisible to the standard evaluation suite**; roughly 60% of projects that die after a
successful pilot die on freshness rather than retrieval quality.

The five cases below are from this repository — four from a single day, the fifth found three
days later inside the note describing the first four. They are small. That is the point: none
of them looked like a failure while it was happening, and each was passing a green check at
the time.

---

## Case 1 — A citation stitched from three editions

**What was wrong.** A capsule quoted the FIDE Laws of Chess. The quoted text came from the
2023 edition, the article number came from the 2009 edition, and the link pointed at the 2009
PDF. Three sources, one citation, one confident sentence.

**Why it survived.** The test asserted that `evidence.ref` was a non-empty string. It was.

**What caught it.** A check that fetches the reference and looks for the quote in the response
body. Not clever — just the difference between "a field is filled in" and "the source says
this."

**Generalises to:** any corpus whose provenance check is a schema check. Presence of a
citation field is not evidence of citation. If nothing dereferences the link, the link is
decoration.

---

## Case 2 — Two statements of one contract, disagreeing in silence

**What was wrong.** A prompt handed to an evaluated model specified a response shape:
`move`, `legal`, `state_fen`, `explanation`, `completed`. The evaluator that scored the replies
read a different shape: `moves`, `text`. The model complied with the contract it was shown, in
every fixture of every trial, and was published at half its actual score — with the failure
attributed to the model rather than to us.

**Why it survived.** Both statements of the contract were internally consistent. Nothing
compared them to each other, because nothing knew there were two.

**What caught it.** Opening both files and reading them side by side. Afterwards: making the
contract a single file that both the prompt and the evaluator are generated from, plus a check
that fails if the generated artifact is hand-edited.

**Generalises to:** every place a schema is described twice — once in documentation and once in
code, or once in an ingestion pipeline and once in a validator. Two lists drift. The only
durable fix is one list plus a machine that notices a second one appearing.

---

## Case 3 — An answer key that punished knowing the subject

**What was wrong.** A twelve-fixture benchmark had the wrong expected answer in six of them.
The positions omitted both kings, so none was a legal chess position and no engine would load
one; hand-written move logic stood in for an engine and encoded its author's two
misunderstandings — that en passant is compulsory, and that the side to move does not change
after a move.

The consequence is the interesting part. A model that knew the rules **scored lower**. The
first model evaluated agreed with the key and scored 36/36. A second model, from another
vendor, disagreed on exactly those six and would have been published as the weaker of the two.

**Why it survived.** The reference control run also scored 36/36 — because it was built from
the same key. A control that shares the assumption it is meant to test confirms nothing.

**What caught it.** Disagreement between two vendors' models, and an operator who recorded the
disagreement instead of quietly adjusting one side to match the other.

**Generalises to:** any gold set curated by the same process that consumes it. If your
evaluation data and your system share an author, agreement between them is not evidence.

---

## Case 4 — One position, three recordings, three different answers

**What was wrong.** The same chess position after the same move was written down three times
in one repository: once in a capsule's interactive scene, once in the benchmark's expected
result, once in prose one line below the scene. All three differed. The prose said the pawn
was on d6; the scene put it on d5; the benchmark had the right square and the wrong side to
move.

**Why it survived.** Each copy was locally plausible, and no reader ever had two of them on
screen at once.

**What caught it.** Investigating something else entirely.

**Generalises to:** the ordinary condition of most documentation. Copies do not disagree
loudly; they disagree in the one field nobody re-reads.

---

## Case 5 — The paragraph warning about second statements, stated twice

Added 2026-08-15, three days after the first four. It is kept because a note about silent
staleness that stops collecting cases the moment it is published would be demonstrating its
own subject rather than documenting it.

**What was wrong.** The specification's section about the four errors above existed twice in
the same file: a rewritten, accurate version, and directly beneath it the superseded version
it was meant to replace. They contradicted each other in the plainest possible way. The first
said not one of the errors was caught by the format. The second closed with the claim that the
format "made them findable." A reader got two answers to one question, in one section, with
nothing marking which was current.

**Why it survived.** The rewrite was appended and the old text was never deleted — an edit that
looks complete in a diff, because the diff shows the good new paragraphs and says nothing about
the old ones still sitting below. Three days of readings of that file, by author and agents,
never had both halves on screen at once. Twenty-three lines apart is far enough.

**What caught it.** An agent asked to inventory this corpus for an unrelated purpose, reading
the file end to end because it had no expectation of what should be there. Not the author
rereading his own prose, and not `selftest.mjs` — which by then ran 78 assertions, none of
which look at prose for self-contradiction.

**Generalises to:** every document that was corrected rather than rewritten. The most dangerous
place for a stale statement is directly underneath the statement that replaced it, because
that is the one place a reader assumes has been handled.

---

## What the five have in common

**Every one was green at the time.** Not unchecked — *checked, by something that could not see
the defect.* The gap was never between "tested" and "untested"; it was between a check that
verifies shape and a check that verifies correspondence with the world.

**Four of the five were found by disagreement, not by inspection.** Two files compared,
two vendors' models compared, two documents open at once, one reader with no expectation of
what the file should contain. Nothing found them by looking harder at one thing.

**Three of the five were found by a party that did not share the author's assumptions** —
another vendor's model twice, an agent with no prior reading of the file once. This is the
single most productive detector in the list below, and the count keeps growing in its favour.

**None of them was found by the format.** The capsule format made the fields exist so a check
could be written against them. It did not do the checking, and saying otherwise was the first
thing an external reviewer objected to.

## Four cheap detectors, in the order they pay off

1. **Dereference every reference, and match the quote.** Not "is the field populated" — fetch
   it and look for the text. Report unreachable as *unverified*, distinct from *wrong*.
2. **Count how many places state each contract.** If the answer is more than one, generate the
   rest from the first, and add a check that fails when a generated file is edited by hand.
3. **Give every claim an expiry and a trigger.** A date alone becomes a formality; the trigger
   is what turns "recheck in a year" into "recheck when the standard revises."
4. **Get a second reader who does not share your assumptions.** Another vendor's model, a
   colleague outside the project, anyone whose agreement is not guaranteed by construction.
   This one found more than the other three combined.

## Provenance of this note

Every case links to its record: the retractions and their raw evidence in
[RESULTS.md](RESULTS.md), the retired protocol in [CHESS-BENCHMARK-V0.1.md](CHESS-BENCHMARK-V0.1.md),
the external review with its prompt in [reviews/](reviews/). The market figures come from
published 2026 analyses of enterprise RAG deployments, cited at
[ragaboutit.com](https://ragaboutit.com/7-rag-failure-modes-crippling-enterprise-deployments-in-2026/)
and [tianpan.co](https://tianpan.co/blog/2026-04-20-rag-knowledge-base-freshness-index-rot);
they are other people's numbers and are reported as such.

Written 2026-08-13. If you are reading this much later and nothing above has been revised, that
is itself a data point about the author.
