---
name: bootstrap
description: Provision a project's Claude Code, Codex, or combined setup from the Turma catalog, showing the grounded choices before scaffolding.
---

# turma:bootstrap

First read [runtime conventions](../../references/runtime.md). `$scope` is a sentence,
a scope document, or a target directory. A README from `init` is the usual scope.

Select `claude`, `codex` or `both` from the user's request. Default to the active host
for a new project; on an existing setup preserve the manifest's hosts and add the
requested host. Do not remove the other host's setup. These are output targets, not
instructions to launch another assistant.

## Context

Read the scope, README, existing project instructions (`CLAUDE.md` and `AGENTS.md`),
package scripts, the base `catalog/registry.json`, any overlay catalog and prior
rulings in `TURMA_HOME/decisions.jsonl`. Resolve `REPO`, `STATE` and `TURMA_HOME` with
the runtime helper. Read any existing `STATE/turma-manifest.json`.

## Steps

1. **Ground the setup.** Identify what the project produces, its source of truth,
   generated outputs, stack and actual guard command. Do not invent a runnable guard.

2. **Select blocks for each target.** Respect a block's `hosts` list; an absent list
   means shared. Apply relevant prior accepted/deferred/rejected decisions.
   - Shared defaults: `claude-md/house-rule`, `claude-md/workflow`,
     `hook/turma-paths`, `hook/commit-queue`, `hook/optimizer-nudge`. The historical
     `claude-md/*` IDs are retained for decision-log compatibility; their files now live in `catalog/instructions/`
     and serve both hosts.
   - Claude defaults: `settings/deny-env-reads`, `settings/hook-wiring`.
   - Codex default: `settings/codex-hook-wiring`.
   - Next.js: `hook/no-build-over-dev-server` and each target's
     `settings/claude-build-guard` or `settings/codex-build-guard`.
   - The after-commit nudge is opt-in only: it costs context on every commit, and
     the SessionEnd nudge already reports the queue. Pair `hook/after-commit-nudge`
     with `settings/hook-wiring-commit-nudge` (Claude) or
     `settings/codex-hook-wiring-commit-nudge` (Codex), and render with `--commit-nudge`.
   - Claude's outside-repo read hook is opt-in only. Pair
     `hook/no-read-outside-repo` with `settings/hook-wiring-read-guard`.
     Do not install that rule or Claude permission keys for Codex. State the
     limitation from the runtime conventions if the user asks for equivalent coverage.
   - Select other patterns only when grounded in the repo's actual files and commands.

3. **Present the provisioning report.** Show each block, its grounds, target host(s),
   exact destination and any unresolved prerequisites. Include a missing `jq`, `bash`
   or `lsof` dependency needed by selected hooks. Defer blocks that cannot be grounded.
   Honor earlier approval of this concrete scope; otherwise wait for approval of the
   report before writing. A request to support both hosts does not authorize changing
   user-level sandbox policy or marking Codex hooks trusted.

4. **Scaffold the approved setup.**
   - Initialize Git if needed. Resolve the Git root again and create `STATE`.
   - Copy `turma-paths.sh` and selected hooks verbatim into `STATE/hooks/`.
     Mark executable scripts executable. Always include the helper beside the hooks.
   - Install one Git `post-commit` call to the copied `commit-queue.sh`. Find the
     effective path with `git rev-parse --git-path hooks/post-commit`, respecting
     `core.hooksPath`. Preserve an existing hook and its behavior. Inspect for an
     existing Turma call or an older inline Turma queue script and update that
     installation; never append a second Turma queue writer. The queue script must
     run from `STATE/hooks/` so its sibling helper exists. A shared external hook
     directory requires a per-repository dispatch, not a hard-coded project path.
   - Run `node <plugin>/scripts/render-hooks.mjs --host <claude|codex>
     --state-dir <.turma|.claude>` to render correctly quoted commands from
     the catalog. Add `--next` for the build guard, `--read-guard` for Claude's
     optional read guard, `--commit-nudge` for the optional after-commit nudge. Run once per target for `both`. Merge Claude fragments into
     `.claude/settings.json`; merge Codex fragments into `.codex/hooks.json`.
     Omit catalog `_comment` fields. Merge event lists and deduplicate Turma hooks;
     preserve unrelated entries. Replace older Turma hook commands rather than
     leaving both old and new paths active. Do not copy `permissions` to Codex.
   - Assemble selected `catalog/instructions/` fragments for the target's instruction
     file. Fill `<GUARD_COMMAND>` and layout slots from real files. Translate workflow
     commands using the runtime conventions. Merge with existing instructions after
     reading them. For `both`, keep common policy in `AGENTS.md`, and make `CLAUDE.md`
     refer to `@AGENTS.md`, retaining any existing Claude-specific instructions.
     Do not create a circular include or duplicate the common policy in both files.
   - Fill agent/skill patterns from actual files and write them to the runtime table's
     target locations. For Codex agent patterns, use a skill with the shared procedure
     and omit Claude tool metadata. For explicit-only skills, add the Codex invocation
     policy. For `both`, keep each procedure body in one repo-owned reference and
     generate thin host entrypoints pointing at it.
   - Shared reusable additions belong under `TURMA_HOME/catalog/` plus its registry;
     host user-level entrypoints follow the runtime table. Project-specific additions
     stay in the target repo. Never write new blocks into the installed plugin cache.
   - Add the resolved queue and review-state paths to `.gitignore`, relative to `REPO`.
   - Merge `STATE/turma-manifest.json`: `catalogVersion`, `generatedAt`, `hosts`,
     `blocks` (IDs), and `files` mapping relative paths to `{sha256, kind, source}`.
     Preserve `githubProject`, previously installed hosts and unrelated fields.
     Track only verbatim copies for drift; note repo-owned instructions, substituted
     settings, filled patterns and Git hook wrappers under `note`. `source` is a path
     relative to the plugin root. One manifest serves both hosts.
   - Append a ruling for each accepted, deferred or rejected block to
     `TURMA_HOME/decisions.jsonl`: `{ts, source:"bootstrap", repo, proposal,
     disposition, block, hosts}`. Create the directory if needed; never rewrite history.

5. **Report the result.** Name the installed hosts, state location, guard and deferred
   blocks. For Codex, tell the user to review the generated hooks in `/hooks` in a
   trusted project before expecting reminders or guards. Do not claim they are active
   without runtime verification. Print commit and optional `gh repo create` steps
   (do not create the remote yourself), then the active host's `design` invocation.

## Rules

- Never overwrite a file you did not read first. Merge configuration, not replacement.
- Re-running bootstrap must not duplicate queue writers, hook handlers or common policy.
- Keep existing state in place when adding another host; never silently combine logs.
- Prefer existing catalog blocks and shared procedures over duplicate definitions.
