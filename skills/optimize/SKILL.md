---
name: optimize
description: Review the commits since the last run and propose the agents, skills or hooks that would make the next stretch of work faster or safer. Records what you accept.
disable-model-invocation: true
---

# turma:optimize

Reads the base catalog from `${CLAUDE_PLUGIN_ROOT}/catalog/` (read-only - never write
there; it is an install cache `claude plugin update` overwrites) and the user's own data
from `TURMA_HOME` (default `~/.claude/turma`): `decisions.jsonl`, and an optional overlay
`catalog/registry.json`. Anything new that is shared across this user's repos goes to the
user level - the overlay catalog, `~/.claude/agents/`, `~/.claude/skills/`; anything
specific to one repo goes in that repo's `.claude/`.

## Context

```!
PLUGIN="${CLAUDE_PLUGIN_ROOT}"
TURMA_HOME="${TURMA_HOME:-$HOME/.claude/turma}"
dir="${CLAUDE_PROJECT_DIR:-$PWD}/.claude"
echo "Queue:"; cat "$dir/optimizer-queue.log" 2>/dev/null || echo "(none)"
echo; echo "State:"; cat "$dir/optimizer-state.json" 2>/dev/null || echo "(none)"
echo; echo "Recent commits:"; git log --oneline -15 2>/dev/null
echo; echo "Base catalog:"; cat "$PLUGIN/catalog/registry.json"
echo; echo "Overlay catalog:"; cat "$TURMA_HOME/catalog/registry.json" 2>/dev/null || echo "(none)"
echo; echo "Prior decisions:"; cat "$TURMA_HOME/decisions.jsonl" 2>/dev/null || echo "(none yet)"
```

## Steps

1. **Determine the range.** The queue lists commits recorded since the last review. If it
   is empty, there is nothing to do - say so and stop. If there is no state file, review
   the last 10 commits.

2. **Run the optimizer.** Invoke the `workflow-optimizer` agent with the commit range,
   the queue contents and the catalog. Let it read the diffs and produce its ranked
   report.

3. **Present the report** to the user. For each proposal, make the choice explicit:
   accept (build now), defer (record, revisit next run), or reject (record, suppress in
   future).

4. **Record every ruling.** Append one line per proposal to `TURMA_HOME/decisions.jsonl`
   (create the directory and file if missing):
   `{"ts": <iso>, "source": "optimize", "repo": <name>, "proposal": <text>, "disposition": <accepted|deferred|rejected>, "block": <id or null>, "note": <commit SHAs>}`.
   Append only. Never rewrite an existing line.

5. **Build what was accepted.** For each accepted proposal, create the block: fill the
   catalog `patterns/*` skeleton from the real files the agent named. Shared across the
   user's repos: a catalog block under `TURMA_HOME/catalog/` plus an entry in
   `TURMA_HOME/catalog/registry.json` (same shape as the base registry); an agent in
   `~/.claude/agents/`; a skill in `~/.claude/skills/`. Specific to one repo: that repo's
   `.claude/`. Update the repo's `turma-manifest.json` for any file written into the
   repo. A block that belongs in the public plugin itself is a change to the Turma source
   repo - say so, do not do it from here.

6. **Close the loop.**
   - Write `${CLAUDE_PROJECT_DIR}/.claude/optimizer-state.json`:
     `{"lastReviewedSha": <newest queued SHA>, "reviewedAt": <iso>}`.
   - Truncate `${CLAUDE_PROJECT_DIR}/.claude/optimizer-queue.log`.

## Rules

- The agent proposes; this skill records and builds, only after the user rules.
- `decisions.jsonl` is append-only. The guard checks that.
- Do not pad. If the honest answer is "nothing worth adding this run", record nothing and
  say so.
- Never write into `${CLAUDE_PLUGIN_ROOT}`.
