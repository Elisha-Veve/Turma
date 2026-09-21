<!-- PATTERN: a skill that runs the repo's guard script and reads its output before a PR.
     disable-model-invocation so it only runs when asked. Fill <GUARD COMMAND> and the
     list of what the guard proves from the repo's own check script. -->
---
name: check
description: Run <REPO>'s house-rule guard and report what it found, before opening a PR.
disable-model-invocation: true
allowed-tools: Bash(<GUARD COMMAND>) Bash(git diff *) Bash(git status *)
---

# Check

Run the guard and read its output, not just its exit code.

```!
<GUARD COMMAND>
```

Then:

1. If it exited non-zero, report each failure it named, with the `file:line` it pointed
   at and the one-line fix. Stop; the PR is blocked.
2. If it passed but printed warnings, list them and say whether each is acceptable to
   ship.
3. If it passed clean, say so plainly. Do not invent concerns.

The guard proves: `<WHAT IT PROVES - lifted from the check script's own header>`.
A guard that silently skips (missing base ref, missing fixture) is a failure, not a pass.
