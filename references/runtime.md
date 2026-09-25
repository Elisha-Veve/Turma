# Runtime conventions

Read this once before running a Turma skill. The same skills and catalog serve Claude
Code and Codex; the assistant hosting this session determines the invocation syntax.

## Resources and inputs

Resolve the plugin root from this skill's loaded file path: `skills/<name>/SKILL.md`
is two directories below it. All `catalog/`, `scripts/` and `references/` paths in
these instructions are relative to that root, never the target project's cwd.
An available `CLAUDE_PLUGIN_ROOT` or `PLUGIN_ROOT` may identify the same root, but
do not require either environment variable. Never write project data into the plugin.

An input named `$idea`, `$items`, `$problem`, `$design`, `$issue`, `$scope` or `$target` means the user's
arguments or message, not a shell variable automatically supplied by the host.
Context sections are explicit read-only work to perform with the host's tools.
Use the host's question tool when available, otherwise ordinary conversation.

Claude invocation is `/turma:<name>`. In Codex, select the Turma skill through `$`
(for example `$design`) or ask to use Turma's named skill. Disambiguate by plugin
when another installed skill has the same name. Translate next-step commands to
the active host; do not tell a Codex user to type a Claude slash command.

## Shared state

Resolve paths using the shipped helper, with its actual absolute path:

```bash
bash /absolute/plugin/catalog/hooks/turma-paths.sh root /absolute/project
bash /absolute/plugin/catalog/hooks/turma-paths.sh state /absolute/project
bash /absolute/plugin/catalog/hooks/turma-paths.sh home
```

In the skills, `REPO` means the resolved project root, `STATE` the state directory,
and `TURMA_HOME` the resolved user data directory. These names are notation; bind
them explicitly when using a shell.

- New projects use `REPO/.turma/` for the manifest, commit queue, review state and hooks.
- Existing projects with a Turma manifest, queue or review state in `.claude/` keep
  that directory. Both hosts use it; merely having Claude settings does not count.
- User data uses explicit `TURMA_HOME`, otherwise existing `~/.claude/turma`, otherwise
  `~/.turma`. Decisions and overlay catalog are shared by both hosts.
- Do not automatically move, combine or truncate old state when adding a host. If
  both project state locations contain Turma data, report the conflict and resolve it
  before writing. The legacy location wins resolution so an old Git hook stays coherent.

## Host-specific output

| Output | Claude Code | Codex |
|---|---|---|
| Project instructions | `CLAUDE.md` | `AGENTS.md` |
| Local skills | `.claude/skills/<name>/SKILL.md` | `.agents/skills/<name>/SKILL.md` |
| User skills | `~/.claude/skills/<name>/SKILL.md` | `~/.agents/skills/<name>/SKILL.md` |
| Agent procedures | `.claude/agents/<name>.md` | A skill in `.agents/skills/<name>/` |
| User agent procedures | `~/.claude/agents/<name>.md` | A skill in `~/.agents/skills/<name>/` |
| Hook configuration | `.claude/settings.json` | `.codex/hooks.json` |

For Codex, turn an agent pattern into a skill with `name` and `description`
frontmatter and the same procedure body. For all generated Codex skills, omit Claude
`tools`, `allowed-tools` and `disable-model-invocation` metadata.
For an explicit-only skill, preserve that policy with
`agents/openai.yaml`: `policy: { allow_implicit_invocation: false }`.
The generated Claude entrypoints in `claude-skills/` carry its invocation flag;
Codex's shared skills carry that policy in `agents/openai.yaml`. The planning/work
skills are explicit-only; `review` also supports normal discovery for review requests.
Install Claude
through the root-source marketplace so its manifest selects only those entrypoints.

Use the shared optimizer procedure linked from `optimize`. Claude can invoke its
bundled agent wrapper. Codex can perform that review in the current session or
delegate when supported and authorized. Never report a separate review if none ran.

## Hook support

Both hosts expose shell hook input as `tool_input.command` with the `Bash` matcher.
Use the catalog's host-specific wiring and common scripts. Codex project hooks
require a trusted project configuration and review in `/hooks`; generated files
alone do not activate them. Do not bypass that review or edit trust records.

The optional outside-repo read hook and `permissions.deny` settings are Claude-only.
They do not cover shell reads and are not a filesystem sandbox. Do not translate
them into fictitious Codex permission keys. For Codex, explain the limitation and
use its existing sandbox/approval configuration; defer equivalent enforcement if
the user's requested restriction cannot be represented by the host.

Sources: [Codex hooks](https://learn.chatgpt.com/docs/hooks),
[plugin packaging](https://developers.openai.com/plugins/build/plugins).
