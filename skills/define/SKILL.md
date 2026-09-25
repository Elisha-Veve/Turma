---
name: define
description: Turn a rough problem into an expanded problem statement through conversation, covering context, scope and success criteria, and save it under docs/problems/.
---

# turma:define

First read [runtime conventions](../../references/runtime.md) and resolve the project
and state paths. Preserve the user's existing authorization and constraints.

Write `docs/problems/<slug>.md` in the repo you are working in - the seed the rest of
the loop reads from. `turma:design` reads it to produce the system design; nothing
downstream should ever restate a fact this document already states.

The skeleton this skill fills is `catalog/doc-templates/problem-statement.md`.
Read it from there; never write into the plugin directory.

## Context

Read `catalog/doc-templates/problem-statement.md` and list existing documents under
`docs/problems/` in the target repository.

## Steps

1. **Take `$problem` as given.** It may be a sentence, a path to notes, an item
   promoted from `docs/inbox.md` by `turma:inbox`, or empty - if empty and the inbox
   has items, offer them; otherwise ask what prompted this before doing anything else.

2. **Expand it by asking, not assuming.** Work through, in conversation: who feels this
   and how often; what happens today in its absence - the actual failure, named, not "it
   would be nice if"; what "solved" looks like, concretely enough to test later; what is
   explicitly out of scope. Use plain conversation for open framing questions; use
   the host's question tool only for a genuine short list of concrete options. Keep asking until
   the problem has context, a scope line, and testable success criteria - not until it
   is exhaustive. Never guess an answer the user has not given - leave it under Open
   questions instead.

3. **Derive the slug** from the problem's subject, `kebab-case`, no date (a date belongs
   to git history, not the filename).

4. **Draft `docs/problems/<slug>.md`** from the template, filled with what was said, in
   the user's words where possible.

5. **Show the full draft and wait.** A half-formed problem statement sends
   `turma:design` down the wrong path - do not write until the user says it is ready.

6. **On approval, write the file** with `Status: expanded`. Do not commit it - that is
   the user's call, same as any other file. If the problem came from `docs/inbox.md`,
   remove that item in the same step - the problem doc now owns it. Tell the user the
   next step is `/turma:design docs/problems/<slug>.md`.

## Rules

- Never guess an answer to a clarifying question; leave it open and named under "Open
  questions" instead.
- One problem, one file. A second problem is a second `turma:define` run, not a longer
  doc.
- `turma:design` refuses to run against a problem doc with open questions still listed -
  keep the doc honest about what is still unknown rather than papering over it.
- This skill never touches GitHub and never writes to Turma; it only reads the template.
