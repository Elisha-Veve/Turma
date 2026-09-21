---
name: work
description: Implement one GitHub Issue end to end - read it and the design section it cites, make the change, run this repo's guard, get a second opinion from the repo's auditor agent where one exists, open a PR referencing the issue, and update the issue and its Project status. One ticket in flight at a time.
disable-model-invocation: true
arguments: [issue]
---

# turma:work

Implement `$issue` - an issue number, or empty to take the lowest-numbered open issue
whose Project status is `Todo` (deterministic; a board's visual column order isn't
something `gh` exposes reliably). One ticket in flight at a time: this skill checks the
Project board for another item already `In Progress` before starting anything.

## Context

```!
OWNER=$(gh repo view --json owner --jq .owner.login 2>/dev/null)
REPO=$(gh repo view --json name --jq .name 2>/dev/null)
PROJECT=$(gh project list --owner "$OWNER" --format json --jq ".projects[] | select(.title==\"$REPO\") | .number" 2>/dev/null)
echo "Repo: $OWNER/$REPO  Project: $PROJECT"
if [ -n "$PROJECT" ]; then
  echo; echo "Board:"; gh project item-list "$PROJECT" --owner "$OWNER" --format json 2>&1
fi
echo; echo "Working tree:"; git status --short
echo; echo "Open PRs:"; gh pr list --state open 2>&1
echo; echo "Guard candidates:"; grep -m1 -i guard CLAUDE.md 2>/dev/null; grep -A1 '"check"' package.json 2>/dev/null
```

## Steps

1. **Resolve the repo's Project.** If none exists, stop - `turma:tickets` hasn't run
   yet, there is nothing to work from.

2. **Enforce one in flight, off the live board, never memory.** If any item's status is
   `In Progress`, that is the ticket - use it, and if `$issue` names something else,
   confirm with the user before resetting the in-progress item's status back to `Todo`
   and switching. Otherwise take `$issue`, or the lowest-numbered open issue with status
   `Todo`.

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

7. **Run this repo's guard.** Discover it from `CLAUDE.md`'s `<GUARD_COMMAND>` line or a
   `package.json` `check` script; ask the user if neither exists. Run it, read its
   output, and do not proceed while it fails.

8. **Get a second opinion where one exists.** If this repo has its own auditor agent
   (for example a `<repo>-auditor` bootstrap installed), invoke it against the diff. Its report is advisory; the guard from step 7 is authoritative - if they
   disagree, say so, do not silently pick one. If none exists, say so and move on;
   that gap is itself a `turma:optimize` candidate.

9. **Branch, then open a PR.** One branch per ticket. Commit, push, `gh pr create`
   with `Closes #<issue>` in the body. Move the Project item to `In Review`. Stop there
   - merging is the user's call, a checkpoint before code reaches the default branch.

10. **Report:** what changed, the guard's verdict, the auditor's verdict if one ran, the
    PR link, and the board state.

## Rules

- One ticket in flight. Check the board, not memory.
- The issue is a pointer to the design, never a substitute for reading it.
- The guard's verdict beats the auditor's and beats your own reading of the diff.
- Never open a PR the guard has not passed against. Never merge it yourself - that is
  the user's call.
