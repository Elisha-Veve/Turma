---
name: open
description: Show every open work item in this repo - open tickets by workstream with their Project status and PR, open PRs with no ticket, and branches with commits that never got a PR. Read-only.
---

# turma:open

First read [runtime conventions](../../references/runtime.md) and resolve the project
and state paths.

Show what is open, read live from GitHub and the local checkout. `$workstream` - a
workstream slug to show only that stream, or empty for everything. This skill changes
nothing: no status moves, no labels, no branches, no comments.

Use `gh ... --jq '...'` (the flag `gh` ships, not a piped external `jq`).

## Context

Resolve the repository owner/name/default branch, then the Project from
`STATE/turma-manifest.json`, confirming it resolves; otherwise find a Project titled
like the repository. Without a Project, still report issues and PRs and say the board
is missing.

## Steps

1. **Read the open issues.** `gh issue list --state open --limit 500 --json
   number,title,labels,assignees,url`. Each issue's workstream is its
   `workstream:<slug>` label; one without such a label goes under "no workstream".

2. **Read their statuses off the board.** `gh project item-list <number> --owner <owner>
   --limit 500 --format json`. An open issue that is not on the board is reported as
   `not on board`, never assumed `Todo`.

3. **Read the open PRs.** `gh pr list --state open --limit 500 --json
   number,title,headRefName,baseRefName,isDraft,labels,closingIssuesReferences,url`.
   Pair each PR with the issue it closes. A PR based on another open PR's head branch is
   stacked on it.

4. **Find stranded work.** `git fetch`, then for each local and remote branch other than
   the default: commits in `git log origin/<default>..<branch>` with no open PR for that
   branch are a work item that never got one.

5. **Print the report,** filtered to `$workstream` when given (an unknown slug is a stop
   that lists the slugs that exist):
   - **In flight** - any item `In Progress`, first, on its own.
   - **One table per workstream,** ordered by its lowest open issue number, rows in
     issue-number order: issue, title, status, PR, PR base. The stack reads top to
     bottom; mark a ticket worked out of order and a stack with a hole (a PR whose base
     branch is gone).
   - **No workstream** - open issues without a workstream label.
   - **PRs with no ticket** - open PRs that close no issue.
   - **Stranded** - branches with unmerged commits and no open PR.
   - A one-line count: open tickets by status, open PRs, workstreams with work left.
   Leave out a section that is empty, except the count.

6. **Name the next command,** one line: `/turma:work <n>` for the ticket in flight or
   the lowest-numbered `Todo`, and `/turma:workstream <slug>` for its stream.

## Rules

- Read-only. Anything this report shows as wrong is fixed by the user or by the skill
  that owns it.
- Every row comes from a `gh` or `git` call made in this run, never memory or an earlier
  report.
- A status the board does not give is reported as missing, not guessed.
