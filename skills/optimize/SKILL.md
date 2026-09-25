---
name: optimize
description: Review commits since the last run and propose agents, skills or hooks that would make future work faster or safer. Record the user's rulings.
---

# turma:optimize

First read [runtime conventions](../../references/runtime.md) and resolve `REPO`,
`STATE` and `TURMA_HOME`. Both hosts review the same queue and append to the same
user decision log. The installed plugin catalog is read-only.

## Context

Read `STATE/optimizer-queue.log`, `STATE/optimizer-state.json`, recent Git history,
`catalog/registry.json`, and any overlay catalog and `decisions.jsonl` in `TURMA_HOME`.

## Steps

1. **Snapshot the range.** If no review state exists, review up to the last 10 commits
   even if no queue exists yet. Otherwise use the queued commits; an empty queue means
   nothing to review. Keep the original queue snapshot and its newest SHA so commits
   added during the review are not accidentally marked reviewed. A queued SHA that no ref
   can reach, with a later entry of the same `git patch-id` (a rebase replay, recorded as
   `<branch> (rebase)`), is superseded: review the later entry, not both.

2. **Review.** Use the shared [optimizer procedure](references/workflow-optimizer.md).
   Claude Code may invoke the bundled `workflow-optimizer` agent with the range,
   queue and catalog. In Codex, follow the procedure here or delegate when supported
   and authorized. Report whether the review was delegated; do not invent an agent run.

3. **Present the ranked proposals.** The user accepts, defers or rejects each. Honor
   their existing authorization for the concrete proposals; otherwise wait for rulings.
   Do not pad a report with speculative additions when nothing is worth changing.

4. **Record every ruling.** Append JSONL to `TURMA_HOME/decisions.jsonl`:
   `{ts, source:"optimize", repo, proposal, disposition, block, note}` with the
   supporting commit SHAs in `note`. Create the directory if needed; never rewrite
   earlier entries. A review with no proposals adds no decision rows.

5. **Build accepted additions.** Follow bootstrap's host-specific output rules and
   the installed manifest's `hosts` (or the active host for an older manifest).
   Fill catalog patterns with the real files and commands the review named.
   Shared additions go to the user overlay catalog and appropriate user entrypoints;
   repo-specific additions go to the target's skill/agent directories. For both hosts,
   keep procedure bodies shared and entrypoints thin. Merge the project manifest
   without dropping its Project pointer or other host. Changes to the public plugin
   itself belong in its source repo, not its installed cache.

6. **Finish safely.** Write `STATE/optimizer-state.json` with
   `{lastReviewedSha, reviewedAt}` for the actual reviewed range. Remove only the
   reviewed snapshot prefix from the queue, preserving newly appended lines. If the
   queue no longer begins with that snapshot, leave it intact and report the conflict.
   Avoid concurrent optimize runs against the same queue.

## Rules

- Review first; build only the accepted proposals.
- Decisions are append-only and host-independent.
- Never write into the installed plugin directory.
