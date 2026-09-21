---
name: init
description: Start a new project from an empty repo - talk through what it is, then write the README.md that turma:bootstrap and turma:design read, after you approve it.
disable-model-invocation: true
arguments: [idea]
---

# turma:init

The first step of a new project. Have a discussion about what `$idea` is - a sentence, a
paragraph, or nothing at all - and turn it into the repo's `README.md`. That README is
the project-level scope: `turma:bootstrap` reads it to provision the repo, and
`turma:design` reads it to produce the first architecture. Nothing is written until you
approve the draft.

The skeleton this skill fills is
`${CLAUDE_PLUGIN_ROOT}/catalog/doc-templates/project-readme.md`. Read it from there;
nothing about this project is ever written into the plugin directory.

## Context

```!
echo "Template:"; cat "${CLAUDE_PLUGIN_ROOT}/catalog/doc-templates/project-readme.md"
echo; echo "Directory:"; pwd
echo; echo "Files here:"; ls -A | head -30
echo; echo "Existing README:"; head -20 README.md 2>/dev/null || echo "(none)"
echo; echo "Git:"; git rev-parse --show-toplevel 2>&1 | head -1
```

## Steps

1. **Check the ground.** If a non-empty `README.md` already exists, stop and ask whether
   to revise it or leave it - never overwrite one unread. If the directory holds other
   real project files, say so and confirm this is the right place before continuing.

2. **Discuss it.** Start from `$idea` (if empty, ask what the project is). Work through,
   in conversation and one thread at a time: what it is and who it is for; what it
   produces; what the facts are and where each one lives (entered once); what is derived
   from them and so must be generated; the stack, as far as it is decided; what is in
   scope for v1 and what is deliberately out; whether it starts single-user and what
   must not lock it there; and what a guard script would have to prove. Use plain
   conversation for open framing; use AskUserQuestion only for a short list of concrete
   options (a stack choice, single- vs multi-user). Reflect back what you heard, and
   challenge a vague answer once before accepting it. Keep going until each section
   could be written honestly - not until it is exhaustive.

3. **Never guess an answer the user has not given.** An unknown goes under Open
   questions, and a stack guess is marked as a guess.

4. **Draft `README.md`** from the template, in the user's words where possible. Drop a
   section only if the conversation showed it does not apply.

5. **Show the full draft and wait.** This is gate zero: nothing is written until the
   user has seen the whole README and approved it. On requested changes, revise and show
   again.

6. **On approval, write `README.md`.** Do not commit it - that is the user's call.

7. **Hand off.** Tell the user the next steps, in order: `/turma:bootstrap .` to
   provision the repo from this README; commit; create the GitHub repo themselves
   (`gh repo create <name> --source=. --remote=origin --private --push` - print it, do
   not run it); then `/turma:design` to turn the README into the architecture. If Open
   questions remain, say those need answering (re-run `/turma:init` to revise) before
   `/turma:design` will start.

## Rules

- The user approves the README before it exists on disk.
- Ask, do not assume: an unanswered question is listed, not invented.
- This skill writes exactly one file, `README.md`, and never touches GitHub or Turma.
- One project, one README. A new feature in an existing project is `/turma:define`.
