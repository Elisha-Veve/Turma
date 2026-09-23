---
name: bootstrap
description: Given a project's scope, decide the agents, skills and hooks it needs, show the reasoning, and on approval scaffold them from the Turma catalog.
disable-model-invocation: true
arguments: [scope]
---

# turma:bootstrap

Provision a repo's Claude Code setup from `$scope` - which may be a sentence, a path to a
scope document, or the path to the target directory (an empty one is fine; a `README.md`
from `/turma:init` is the usual scope).

Everything you install is a selection over the catalog. The repo does not get invented
config; it gets named blocks, and a manifest that records which ones so
`scripts/check.mjs` can prove later that nothing drifted.

## Where things live

- **The base catalog** is `${CLAUDE_PLUGIN_ROOT}/catalog/` - read-only, shipped with the
  plugin. Never write into it: `${CLAUDE_PLUGIN_ROOT}` is an install cache that
  `claude plugin update` overwrites.
- **The user directory** is `TURMA_HOME` (default `~/.claude/turma`) - this user's own
  data, created on first write:
  - `decisions.jsonl` - the append-only log of every ruling, read to bias selection.
  - `catalog/registry.json` + `catalog/...` - an optional overlay of blocks this user
    added, same shape as the base registry. Read alongside the base catalog.
- **Shared across this user's repos** means the user level: overlay catalog blocks under
  `TURMA_HOME`, agents in `~/.claude/agents/`, skills in `~/.claude/skills/`. **Local to
  one repo** means that repo's `.claude/`.

## Context

```!
PLUGIN="${CLAUDE_PLUGIN_ROOT}"
TURMA_HOME="${TURMA_HOME:-$HOME/.claude/turma}"
echo "Base catalog:"; cat "$PLUGIN/catalog/registry.json"
echo; echo "Overlay catalog:"; cat "$TURMA_HOME/catalog/registry.json" 2>/dev/null || echo "(none)"
echo; echo "Prior decisions:"; cat "$TURMA_HOME/decisions.jsonl" 2>/dev/null || echo "(none yet)"
echo; echo "Target directory:"; pwd; ls -A | head -30
```

## Steps

1. **Read the scope.** If `$scope` is a path, read it (the directory's `README.md`,
   `CLAUDE.md`, `package.json`, `scripts/` too, if they exist). Identify: what the project
   produces, what its source of truth is, what it generates, what its guard command is or
   should be, and what stack it runs on.

2. **Select blocks.** From the base and overlay registries, choose the hooks, patterns
   and settings fragments that fit. Apply prior `decisions.jsonl`: an `accepted` decision
   for a similar scope is a default yes; a `rejected` one is a default no. Every repo gets
   `claude-md/house-rule`, `claude-md/workflow`, `settings/deny-env-reads`,
   `settings/hook-wiring`, `hook/commit-queue`, `hook/optimizer-nudge`,
   `hook/after-commit-nudge`. A Next.js repo also gets `hook/no-build-over-dev-server`.
   A repo that generates a document gets a `<repo>-render-verifier` from
   `patterns/agent-render-verifier.md`. And so on.

   `hook/no-read-outside-repo` is opt-in, not a default - offer it when the user asks
   for it or names the concern (auto mode reading outside the repo). If selected, also
   select `settings/hook-wiring-read-guard` alongside `settings/hook-wiring`; the two
   travel together, or `settings.json` points at a hook script that was never copied in.

3. **Write the provisioning report.** A table: block, why it fits this repo, the real
   file or command it is grounded in, and where it lands (user level if shared, `.claude/`
   if repo-specific). Flag anything you could not ground in a real file - do not ship it,
   list it as deferred with the trigger that unblocks it. Note any new pattern the
   catalog does not have yet.

4. **Wait for approval.** Do not write anything until the user rules on the report.

5. **On approval, scaffold:**
   - If the target is not a git repo yet, `git init` it (the post-commit hook and the
     optimizer loop need one). Add a `.gitignore` if there is none.
   - `<repo>/.claude/settings.json` - merge `settings/deny-env-reads.json`,
     `settings/hook-wiring.json`, and `settings/hook-wiring-read-guard.json` if
     `hook/no-read-outside-repo` was selected (deep-merge into any existing file; do
     not clobber).
   - `<repo>/.claude/hooks/` - copy each selected catalog `hooks/*.sh` verbatim,
     `chmod +x`.
   - `<repo>/.git/hooks/post-commit` - install catalog `hooks/commit-queue.sh`. If one
     exists, append a call to it instead of overwriting. Respect `core.hooksPath`.
   - `<repo>/CLAUDE.md` - assemble from the selected catalog `claude-md/*` fragments,
     substituting `<GUARD_COMMAND>` and filling the layout section from the real tree.
   - Repo-specific agents/skills - fill the chosen `patterns/*` skeleton from the repo's
     real files, write to `<repo>/.claude/agents/` or `<repo>/.claude/skills/`.
   - Blocks shared across this user's repos - a new catalog block goes under
     `TURMA_HOME/catalog/` with an entry in `TURMA_HOME/catalog/registry.json` (same
     shape as the base registry, `grounds` naming a real need); a new shared agent or
     skill goes in `~/.claude/agents/` or `~/.claude/skills/`. Nothing shared is ever
     written into the plugin.
   - `<repo>/.gitignore` - add `.claude/optimizer-queue.log` and
     `.claude/optimizer-state.json`.
   - `<repo>/.claude/turma-manifest.json` - `{ "catalogVersion", "generatedAt",
     "blocks": [ids], "files": { "<relpath>": { "sha256", "kind", "source" } } }`. Track
     only files copied verbatim from the catalog; a bootstrap-seeded but repo-owned file
     (CLAUDE.md, settings.json) is noted in `note`, not tracked for drift.
   - Append one line to `TURMA_HOME/decisions.jsonl` (create the directory and file if
     missing) per block **ruled on** - `accepted`, `deferred` and `rejected` alike, plus
     any new pattern the catalog lacks:
     `{"ts","source":"bootstrap","repo":"<name>","proposal","disposition","block"}`.
     Append only; never rewrite a line.

6. **Print the finish steps:** commit, create the GitHub repo if the user wants one
   (`gh repo create <name> --source=. --remote=origin --private --push` - print it, do
   not run it), then `/turma:design` for the first architecture.

## Rules

- Ground every recommendation in a named file or command. An ungrounded block is deferred,
  not shipped.
- Prefer an existing catalog block over a new one; prefer a shared block over a local one.
- Never overwrite a file you did not read first. Merge settings, do not replace them.
- Never write into `${CLAUDE_PLUGIN_ROOT}`.
