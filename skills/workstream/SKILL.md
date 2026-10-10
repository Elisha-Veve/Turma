---
name: workstream
description: Work every open ticket of one workstream in order through turma:work, as a stack of PRs each based on the one before. One ticket in flight at a time; merges nothing.
---

# turma:workstream

First read [runtime conventions](../../references/runtime.md) and resolve the project
and state paths. Preserve the user's existing authorization and constraints.

Work `$workstream` - a workstream slug, or empty to take the workstream of the
lowest-numbered open issue whose Project status is `Todo`. A workstream is the set of
issues carrying the label `workstream:<slug>`; `turma:tickets` puts one on every ticket.
The argument is the slug alone - the skill adds the `workstream:` prefix itself. This skill runs [turma:work](../work/SKILL.md)
once per ticket, in issue-number order, and the PRs always stack.

Read `../work/SKILL.md` now. Its steps, its Workstream tickets section and its rules are
the procedure for each ticket; this skill only decides which ticket is next and when to
stop. Nothing here replaces a step there.

## Context

Resolve the repository owner/name and the Project as turma:work does. Read the live
board, `gh label list`, the workstream's issues (`gh issue list --state all --label
"workstream:<slug>" --json number,title,state`) and its open PRs (`gh pr list --state
open --label "workstream:<slug>" --json number,headRefName,baseRefName`).

## Steps

1. **Resolve the workstream.** The label `workstream:<slug>` must exist and at least
   one open issue must carry it. If not, stop and list the slugs that do have open
   issues - never guess a near match.

2. **Read the stream off GitHub, never memory.** Order its issues by number and pair
   each with its Project status and its PR, if one is open. Print that table: it is the
   plan for the run. If an item outside the stream is `In Progress`, turma:work's
   one-in-flight step applies before anything starts.

3. **Settle the stack before adding to it.** If a PR in the stream has merged, the open
   PR that was based on it is retargeted first (turma:work, Workstream tickets). If an
   open stream PR is based on a branch that no longer exists or was closed unmerged,
   stop and report it; a stack with a hole is the user's call.

4. **Take the lowest-numbered `Todo` ticket of the stream** and run turma:work on it,
   start to finish: grounding, `In Progress`, implement, guard, auditor, branch from the
   tip of the stack, PR against the tip with the workstream label, `In Review`.

5. **Repeat step 4** until the stream has no `Todo` ticket left. Do not wait for a merge
   between tickets - the stack is what makes that unnecessary. Each ticket is
   `In Review` before the next goes `In Progress`.

6. **Stop early, and say where,** when a guard fails, a ticket's grounding is not
   accepted and pushed, or a ticket turns out to need something the stream has not
   built yet. The PRs already open stay open; the ticket that stopped the run stays
   `In Progress` with its work on its branch.

7. **Report:** the stack bottom to top - issue, PR link, base branch, guard verdict,
   auditor verdict if one ran - then what is left in the stream and why the run ended.
   The stack merges from the bottom up; that is the user's call.

## Rules

- A workstream's PRs always stack: every PR in the run is based on the one before, and
  only the first is based on the default branch (or on the stream's existing tip).
- Issue-number order is the stack order. Never reorder a stream to get past a ticket
  that is stuck.
- One ticket in flight at a time, within the stream too.
- One workstream per run. Two workstreams at once is turma:work's parallel mode, one
  worktree each.
- Never merge, and never rebase or force-push a branch whose PR is already open without
  asking.
