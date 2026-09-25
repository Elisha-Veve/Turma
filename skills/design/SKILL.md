---
name: design
description: Turn an expanded problem statement into a system design - ADRs numbered from what already exists in docs/decisions/, and a topic doc under docs/ - and hold it for approval before anything downstream depends on it.
---

# turma:design

First read [runtime conventions](../../references/runtime.md) and resolve the project
and state paths. Preserve the user's existing authorization and constraints.

Read `$problem` (a path such as `docs/problems/<slug>.md`, a slug to resolve under
that directory, or nothing - meaning the repo's `README.md` from `/turma:init`, for the
first architecture) and produce the system design that answers it: one or more ADRs for the
decisions that carry real consequences, and a topic doc for the shape of the change.
This is gate #1 - nothing here is `accepted` until you say so, and `turma:tickets`
refuses to build on anything still `proposed`.

`catalog/doc-templates/adr.md` and `design-doc.md` are the templates
this skill fills. The design itself belongs to this repo - never write it into the plugin directory.

## Context

Read `catalog/doc-templates/adr.md` and `design-doc.md`; list the target repository's
existing `docs/decisions/` and topic documents under `docs/`.

## Steps

1. **Read the input.** If `$problem` is empty or names `README.md`, and no
   `docs/problems/` exists yet, this is the repo's first design and the input is the
   `README.md` written by `/turma:init` - the project-level scope. Otherwise it is a
   problem doc from `/turma:define`, and its `Status` must be `expanded`. Either way, if
   the input does not exist or still lists Open questions, stop and say to finish
   `/turma:init` or `/turma:define` first - do not guess past a gap.

2. **Find this repo's design convention.** If `docs/decisions/NNNN-*.md` already
   exists, use that shape. If some other real, named convention already governs design
   docs here, use that instead. Otherwise this is the repo's first design doc - adopt
   the `catalog/doc-templates/` shape and say so; you are establishing the convention,
   not inventing a one-off.

3. **Design.** For the overall shape of the change, draft a topic doc from
   `design-doc.md` - a new `docs/<topic>.md`, or a new section in an existing one if the
   topic already has a home. For each decision with real consequences (a tradeoff a
   later change would have to pay for), draft one ADR from `adr.md`. Not every fact
   needs one - a decision with one sane option doesn't.

4. **Number each ADR right before writing it.** Scan `docs/decisions/*.md` for the
   highest existing `NNNN-` prefix at write time, zero-padded to 4 digits - never reuse
   a number decided earlier in the conversation, in case another ADR landed meanwhile,
   and never reuse one even if a prior ADR was later superseded. The first ADR in a repo
   is `0001`.

5. **Show the full draft** - every topic doc and ADR, in full, with the ADR numbers,
   each `Status: proposed` - and wait.

6. **On approval, write** each file, flipping each new ADR's `Status:` line to
   `accepted (<YYYY-MM>)` (or `accepted-with-limitation (<YYYY-MM>)` if it ships with a
   named, deliberate limitation). Cross-link: the topic doc's Decisions section lists
   the ADRs; each ADR's Context cites the problem doc. On a request for changes, revise
   and show again - do not accept partially.

7. **Tell the user to commit and push** the topic doc(s) and ADR(s) before running
   `/turma:tickets` - the tickets it creates link to these files by their pushed
   location, and a link to an uncommitted file is a link to nothing.

## Rules

- Nothing is `accepted` until the user has seen the full draft. `turma:tickets` checks
  the `Status:` line and that the files are pushed; it refuses to ground a ticket in
  anything else.
- Prefer an existing design convention in this repo over inventing a second one.
- ADR numbers are derived from the directory listing, every time - never ask the user to
  pick one.
- An ADR records a decision with consequences, not every fact - do not write one for a
  detail nothing downstream would need to unwind.
