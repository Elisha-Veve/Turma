---
name: define
description: Turn a rough problem into a written, expanded problem statement - context, scope, success criteria - through conversation, and save it as this repo's docs/problems/<slug>.md.
disable-model-invocation: true
arguments: [problem]
---

# turma:define

Write `docs/problems/<slug>.md` in the repo you are working in - the seed the rest of
the loop reads from. `turma:design` reads it to produce the system design; nothing
downstream should ever restate a fact this document already states.

The skeleton this skill fills is `${CLAUDE_PLUGIN_ROOT}/catalog/doc-templates/problem-statement.md`.
Read it from there; never write into the plugin directory.

## Context

```!
echo "Template:"; cat "${CLAUDE_PLUGIN_ROOT}/catalog/doc-templates/problem-statement.md"
echo; echo "Existing problem docs:"; ls -1 docs/problems 2>/dev/null || echo "(none yet)"
```

## Steps

1. **Take `$problem` as given.** It may be a sentence, a path to notes, or empty - if
   empty, ask what prompted this before doing anything else.

2. **Expand it by asking, not assuming.** Work through, in conversation: who feels this
   and how often; what happens today in its absence - the actual failure, named, not "it
   would be nice if"; what "solved" looks like, concretely enough to test later; what is
   explicitly out of scope. Use plain conversation for open framing questions; use
   AskUserQuestion only for a genuine short list of concrete options. Keep asking until
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
   the user's call, same as any other file. Tell the user the next step is
   `/turma:design docs/problems/<slug>.md`.

## Rules

- Never guess an answer to a clarifying question; leave it open and named under "Open
  questions" instead.
- One problem, one file. A second problem is a second `turma:define` run, not a longer
  doc.
- `turma:design` refuses to run against a problem doc with open questions still listed -
  keep the doc honest about what is still unknown rather than papering over it.
- This skill never touches GitHub and never writes to Turma; it only reads the template.
