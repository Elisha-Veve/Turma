<!-- PATTERN: a skill that regenerates every derived file from its source and shows the
     diff, so a stale artifact is caught before it is committed. List every generate
     command the repo has (README build, screenshots, exports). -->
---
name: regenerate
description: Regenerate every derived file in <REPO> from its source and show what changed.
disable-model-invocation: true
allowed-tools: Bash(<BUILD COMMANDS>) Bash(git diff *) Bash(git status *)
---

# Regenerate

Run each generator, then show the diff:

```bash
<BUILD COMMAND 1>
<BUILD COMMAND 2>
git status --short
```

Report:

1. Which artifacts changed. A changed artifact with no matching source change in this
   branch means the artifact was stale, or was hand-edited earlier - say which.
2. If nothing changed, the artifacts were already current. Say so.

Never commit a source change without its regenerated artifacts in the same commit.
