---
name: work
description: Implement one GitHub Issue from its approved design, run the guard and any repo auditor procedure, open a PR, and update its Project status. One ticket in flight at a time.
---

# turma:work

First read [runtime conventions](../../references/runtime.md) and resolve the project
and state paths. Preserve the user's existing authorization and constraints.

Implement `$issue` - an issue number, or empty to take the lowest-numbered open issue
whose Project status is `Todo` (deterministic; a board's visual column order isn't
something `gh` exposes reliably). One ticket in flight at a time: this skill checks the
Project board for another item already `In Progress` before starting anything.

## Context

Resolve the repository owner/name, then the Project from `STATE/turma-manifest.json`
and confirm it resolves; otherwise find a Project titled like the repository. Read
its live items and statuses, the working tree status and open PRs. Read the active
host's project instructions and `package.json` for the guard command.

## Steps

1. **Resolve the repo's Project.** If none exists, stop - `turma:tickets` hasn't run
   yet, there is nothing to work from.

2. **Enforce one in flight, off the live board, never memory.** If any item's status is
   `In Progress`, that is the ticket - use it, and if `$issue` names something else,
   confirm with the user before resetting the in-progress item's status back to `Todo`
   and switching. Otherwise take `$issue`, or the lowest-numbered open issue with status
   `Todo`. In parallel mode (below) the tickets of the user's batch are the exception:
   each is in progress in its own worktree, by design.

3. **Require a clean working tree.** Stop and say so if not.

4. **Fetch the issue and its grounding.** `gh issue view $issue --json
   title,body,url,labels,state`. Its Grounds line must point at a design doc or ADR that
   is actually committed and pushed (`git log -1 -- <path>` succeeds, and it is on the
   default branch) - a ticket grounded in an uncommitted or still-changing doc is
   grounded in nothing yet; send the user back to commit/push the design first. Read the
   grounding document itself, not just the issue body - the issue is a pointer, never a
   copy.

5. **Mark it in progress.** Look up the Status field's option ids once (`gh project
   field-list <project> --owner <owner> --format json`), then move the item to
   `In Progress` with `gh project item-edit`.

6. **Implement** exactly the ticket's Acceptance criteria - no more, no less. Scope
   creep noticed along the way becomes a new issue (`gh issue create`), never a silent
   addition to this one.

7. **Run this repo's guard.** Discover it from the active host's project instructions' `<GUARD_COMMAND>` line or a
   `package.json` `check` script; ask the user if neither exists. Run it, read its
   output, and do not proceed while it fails.

8. **Review with the repo's auditor procedure where one exists.** In Claude Code,
   invoke the repo's auditor agent. In Codex, use its auditor skill; delegate that
   procedure when supported and authorized, otherwise perform it here and label it
   a self-review. Only call it a second opinion if a separate reviewer ran.
   The report is advisory; if it disagrees with the guard, explain the disagreement.
   If no auditor procedure exists, say so and move on; that gap is an optimizer candidate.

9. **Branch, then open a PR.** One branch per ticket. Commit, push, `gh pr create`
   with `Closes #<issue>` in the body. Move the Project item to `In Review`. Stop there
   - merging is the user's call, a checkpoint before code reaches the default branch.

10. **Report:** what changed, the guard's verdict, the auditor's verdict if one ran, the
    PR link, and the board state.

## Parallel tickets

Only when the user explicitly asks for more than one ticket in flight, and only to the
number they name. Each ticket runs through the steps above in its own git worktree, on
its own branch, based on the latest default branch.

- **Dependencies.** Before running a full install in a new worktree, check whether its
  lockfile matches the main checkout's. If it does, clone the main checkout's
  dependency directory instead (`cp -cR <main>/node_modules <worktree>/node_modules` on
  macOS/APFS takes almost no space); otherwise install. Check free disk before starting
  another worktree: each full install can cost around a gigabyte.
- **Scratch files stay out of the worktree.** Probe scripts, browser harnesses and
  screenshots go in the session's scratch directory. Confirm a UI change with the repo's
  `run` skill (pattern/skill-launch-and-screenshot) where one exists.
- **Stacked tickets.** A ticket that depends on an open PR branches from that PR's
  branch and opens its PR against it (`--base <that branch>`), saying so in the body;
  retarget it to the default branch once the base merges.
- **The commit queue** must resolve to the main checkout (hook/turma-paths does, via
  `--git-common-dir`); otherwise every worktree commit is lost to turma:optimize.
- **After a ticket's PR merges,** before removing its worktree: `git log
  origin/<default>..<branch>` must be empty and `git status --porcelain` must show no
  untracked or modified files. Report anything either shows (a commit pushed after the
  merge never reaches the default branch) and stop. Otherwise remove the worktree and
  its branch.

## Rules

- One ticket in flight, unless the user asked for parallel tickets. Check the board, not memory.
- The issue is a pointer to the design, never a substitute for reading it.
- The guard's verdict beats the auditor's and beats your own reading of the diff.
- Never open a PR the guard has not passed against. Never merge it yourself - that is
  the user's call.
