# Turma

*Turma* is Latin for a cavalry squadron, the smallest unit that manoeuvres together.

A plugin for Claude Code and Codex that takes a project from an idea to shipped tickets with a human
approving each step. You talk through what the project is, Turma writes the README you
approve, provisions the repo's assistant setup, designs the architecture as ADRs you
approve, turns the design into GitHub Issues you approve, and works them one at a time.
An optimizer watches your commits and proposes the agents, skills and hooks that would
have helped.

The idea underneath is one rule, applied to the tooling as well as the code: **a fact is
entered once, and everything derived from it is generated.** A tool definition copied into
several repos becomes several definitions that disagree; Turma keeps each one in one place.

## Install

You need Git and an authenticated GitHub CLI (`gh auth login`). Ticket workflows also
need the `project` scope (`gh auth refresh -s project`). Local hooks need Bash and
`jq`; the Next.js guard also needs `lsof`. The generators and checker need Node.js.

### Claude Code

Run in a terminal:

```bash
claude plugin marketplace add Elisha-Veve/Turma
claude plugin install turma@veve
```

Install through the marketplace (whose plugin source is the repository root), then
restart Claude Code and invoke `/turma:init`, `/turma:bootstrap`, and the other
skills at its prompt. For an unpublished checkout, add its absolute local path as
the marketplace source instead of the GitHub repository.

### Codex

For this local checkout, run in a terminal:

```bash
codex plugin marketplace add /absolute/path/to/Turma
codex plugin add turma@veve
```

Codex supports the existing `.claude-plugin/marketplace.json` catalog, and the
repository supplies a portable `plugin.json` plus `.codex-plugin/plugin.json`.
After this version is published, the marketplace source can also be
`Elisha-Veve/Turma`. A local install uses the checkout, so no push is needed to try it.
Open a new session after installation. Select Turma's skills through `$`, for example
`$init`, or ask "use Turma's design skill". If another plugin has a skill with the
same name, select the Turma entry.

The workflows are shared. Claude loads generated entrypoints from
`claude-skills/`, which carry its invocation policy and point to the shared
`skills/` procedures. Codex loads `skills/` with its own invocation policy.
Claude uses `/turma:<name>`; Codex uses the
corresponding skill selected through `$`. Examples below use Claude syntax; the
skills table lists both forms. Planning and implementation skills are explicitly
invoked in both hosts; `review` can also be selected naturally for a review request.

Codex's generated hooks require a trusted project and review through `/hooks` before
running. Bootstrap reports this setup step; installing the plugin does not bypass it.
The root-source marketplace install is required for Claude to use its explicit
`claude-skills/` selection instead of scanning the shared skills too; see
[Claude path rules](https://code.claude.com/docs/en/plugins-reference#path-behavior-rules).
See the [packaging documentation](https://developers.openai.com/plugins/build/plugins)
and [Codex hook documentation](https://learn.chatgpt.com/docs/hooks).

## Start a project

In an empty repo folder, open your assistant, then run the workflow:

```
/turma:init "what I want to build"      # discuss it; approve the README it writes
/turma:bootstrap .                      # provision the active assistant and shared hooks
/turma:design                           # architecture as ADRs; approve before it is accepted
/turma:tickets docs/<topic>.md          # GitHub Issues on a Project board; approve the batch
/turma:work                             # implement the next ticket, open a PR
```

Commit after `bootstrap`, and push the design before `/turma:tickets` (Turma prints the
`gh repo create` command when there is no remote; it never creates the repo for you).
For a later feature in an existing project, start at `/turma:define` instead of `init`.
To note issues before you are ready to define them, run `/turma:inbox "issue one; issue two"`:
each is appended to `docs/inbox.md` in your words. `/turma:inbox` lists them, and
`/turma:inbox promote 2` runs `define` on item 2, removing it from the inbox once the
problem doc is written.
To provision both assistants, say "use Turma bootstrap for both Claude Code and Codex".
Bootstrap defaults to the active host for new projects and preserves existing hosts
when adding another. Common instructions go in `AGENTS.md`; Claude's `CLAUDE.md`
references it so the policy has one home.

## A walkthrough

Say you want a small recipe-tracking app. Each step below stops and waits for you.

**1. `/turma:init "a recipe tracker for my family"`**
Turma asks questions one thread at a time: who it is for, what it produces, where each fact
lives, what is generated from it, the stack, what is in and out of scope for v1, whether it
must stay single-user. Answer in your own words; "not decided" is a fine answer and goes
under Open questions instead of being guessed. It then shows the whole README. Reply with
changes until it is right, then approve. Only then is `README.md` written.

**2. `/turma:bootstrap .`**
It reads that README and prints a table: each block it would install, why, and the real
file or command behind it. Anything it cannot ground yet is listed as *deferred*, with what
would unblock it. Approve, and it runs `git init` if needed and creates the selected
host configuration, shared hooks, project instructions and an installation manifest.
Then commit, and create the
GitHub repo yourself (`gh repo create recipes --source=. --remote=origin --private --push`).

**3. `/turma:design`**
With no argument it reads the README and drafts the architecture: a topic doc under
`docs/` and one ADR per decision with consequences, numbered from what already exists,
all marked `proposed`. Read them. Ask for changes, or approve; approved ADRs become
`accepted`. Commit and push the docs.

**4. `/turma:tickets docs/architecture.md`**
It checks that the design is accepted and pushed, that a remote exists and that `gh` has
the `project` scope; if not, it stops and prints the fix. Otherwise it shows a table of
tickets, each with a link to the design section it implements, and the exact `gh` commands
it will run. Approve, and it creates the Issues and the Project board.

**5. `/turma:work`**
It takes the lowest-numbered ticket in `Todo`, reads the ticket and the design section it
cites, implements it, runs your guard command, opens a PR that says `Closes #N`, and stops.
Review and merge the PR on GitHub, then run `/turma:work` again for the next ticket. Use
`/turma:work 7` to pick one by number.

## Review completed work

Use `review` to check completed work against its requirements before deciding what
to fix or merge. In Codex, select Turma's `$review` skill; in Claude Code, use
`/turma:review`:

```text
$review                        # staged, unstaged and relevant untracked changes
$review PR 42                  # review this repository's pull request 42
$review HEAD~3..HEAD            # review a particular commit range
```

With a clean working tree and no target, it compares the current branch with the
known default branch, or asks for a target if there is no meaningful comparison.
It reads available acceptance criteria and design documents, checks the actual
implementation, runs appropriate validation, and reports findings with severity,
file/line references and concrete impact. It also names validation gaps.

Review works without a Turma Project board or prior bootstrap. It returns a report
in the conversation; it does not fix code, post GitHub reviews, merge, or update
workflow state unless separately requested. Use `optimize` for improving the tooling
and workflow based on past commits.

## Keeping the setup current

`/turma:optimize` is the loop that improves your tooling. Every commit is queued by a git
hook. Run `/turma:optimize` after a stretch of work (Turma reminds you after assistant
commits and when a session ends with commits unreviewed). It reads the queued diffs and
proposes agents, skills or hooks that would have saved effort, each citing the commits
behind it. You accept, defer or reject each one; accepted ones are built, and every ruling
is logged so the next `bootstrap` starts smarter. If nothing is worth adding, it says so.

## The skills

<!-- generated:skills -->
| Claude Code | Codex | What it does |
|---|---|---|
| `/turma:bootstrap` | `$bootstrap` | Provision a project's Claude Code, Codex, or combined setup from the Turma catalog, showing the grounded choices before scaffolding. |
| `/turma:define` | `$define` | Turn a rough problem into an expanded problem statement through conversation, covering context, scope and success criteria, and save it under docs/problems/. |
| `/turma:design` | `$design` | Turn an expanded problem statement into a system design - ADRs numbered from what already exists in docs/decisions/, and a topic doc under docs/ - and hold it for approval before anything downstream depends on it. |
| `/turma:inbox` | `$inbox` | Capture rough issues into docs/inbox.md as they come up, list them, and promote one to turma:define when it is ready to become a problem statement. |
| `/turma:init` | `$init` | Start a new project from an empty repo - talk through what it is, then write the README.md that turma:bootstrap and turma:design read, after you approve it. |
| `/turma:optimize` | `$optimize` | Review commits since the last run and propose agents, skills or hooks that would make future work faster or safer. |
| `/turma:review` | `$review` | Review completed work in a working tree, commit range or pull request against its requirements and report actionable defects, regressions and missing acceptance criteria. |
| `/turma:tickets` | `$tickets` | Break an approved system design into GitHub Issues on this repo's GitHub Project board, each one grounded in the design section it implements, and hold the whole batch for approval before anything is created on GitHub. |
| `/turma:work` | `$work` | Implement one GitHub Issue from its approved design, run the guard and any repo auditor procedure, open a PR, and update its Project status. |
<!-- /generated:skills -->

## The agent

<!-- generated:agents -->
| Agent | What it does |
|---|---|
| `workflow-optimizer` | Reviews recent commits and the session that produced them and proposes the agents, skills or hooks that would have made the work faster or safer. |
<!-- /generated:agents -->

`optimize` uses one shared review procedure. Claude invokes the bundled agent; Codex
runs the procedure directly or delegates when available and authorized. It reports
which happened. Turma ships no repo-specific agents; `bootstrap` and
`optimize` fill the skeletons in `catalog/patterns/` from your repo's real files, so the
agents you get name your files and your guard command. `examples/agents/` shows what a
grounded agent looks like.

## How it works

**Planning.** Every step ends in a gate. `init` writes nothing until you approve the
README. `design` marks nothing `accepted` until you approve the ADRs. `tickets` creates
nothing on GitHub until you approve the full list of `gh` commands. `work` opens a PR and
stops; you merge. Each ticket cites the design section it implements by an absolute link,
so a ticket that cannot cite one is not created. One ticket is in flight at a time,
checked live on the Project board.

**Provisioning.** `bootstrap` reads the scope and shows a table of the blocks it would
install, each grounded in a real file or command, and writes nothing until you approve.
Every commit is recorded by a Git `post-commit` hook into the shared state directory
(`.turma/optimizer-queue.log` for new projects).
When it suits you, `/turma:optimize` reads the queued diffs for a checker run by hand too
often, work redone, or the same multi-file edit repeated, and proposes what would have
helped. You accept, defer or reject each; every ruling is logged and shapes the next
bootstrap. A one-line nudge after each assistant commit, and a notification at session
end when commits are unreviewed, keep the loop visible.

**The hooks** bootstrap installs for both hosts: a shared Git commit queue, a reminder
after an assistant commit, and a session-end notification (macOS or Linux where a
desktop notifier is available). Next.js projects also get a build-over-dev-server
guard. `TURMA_DEV_PORTS` overrides the configured development ports.

Claude additionally gets its environment-file read deny list and, when requested, the
outside-repo read hook (`TURMA_READ_ALLOW` widens its allow list;
`TURMA_READ_OUTSIDE=request` asks instead of denying). These rules target Claude's
file tools, do not cover shell reads, and are not installed as Codex permissions.
Codex retains its own sandbox and approval settings. Bootstrap reports this difference
if the user requests equivalent restrictions.

## Where your data lives

The installed plugin is read-only. A new project's shared state lives in `.turma/`:

- `turma-manifest.json`: selected blocks, installed hosts and GitHub Project pointer.
- `optimizer-queue.log` and `optimizer-state.json`: pending commits and review progress.
- `hooks/`: copies of the selected catalog scripts and their path helper.

Existing Turma projects keep state in `.claude/`; both hosts resolve that same state.
An ordinary `.claude/settings.json` alone does not make a project legacy. Adding Codex
never moves a queue or rewrites decision history. If both state locations contain Turma
data, resolve the conflict before writing. Re-run bootstrap to refresh old hook copies.

User decisions and the overlay catalog live in explicit `TURMA_HOME`, otherwise an
existing `~/.claude/turma`, otherwise `~/.turma`. Both hosts use this resolution order:

- `decisions.jsonl`: append-only log of the user's rulings.
- `catalog/`: optional overlay blocks and `registry.json`.

Claude host files remain in `.claude/`, with shared user skills/agents under
`~/.claude/`. Codex hooks go in `.codex/hooks.json`; generated local skills go in
`.agents/skills/`, user skills in `~/.agents/skills/`. Agent procedures become skills
on Codex. See [runtime conventions](references/runtime.md) for the exact mapping.

## The catalog

`catalog/` is the base set of reusable blocks. `registry.json` indexes every file once
with the real need it answers.

| Directory | Holds |
|---|---|
| `catalog/hooks/` | Shell hooks: the optimizer queue and nudges, the read-outside-repo and build-over-dev-server guards |
| `catalog/patterns/` | Agent and skill skeletons, filled from a repo's real files |
| `catalog/doc-templates/` | Project-README, problem, ADR, design-doc and GitHub-issue-body skeletons |
| `catalog/instructions/` | Shared project instruction fragments: the house rule, the planning loop, style rules, a layout skeleton |
| `catalog/settings/` | Host-specific hook wiring and Claude permission fragments |

## Troubleshooting

| You see | Why | Do |
|---|---|---|
| `/turma:...` does nothing or is not listed | The plugin loads at startup | Restart Claude Code; check `claude plugin details turma` |
| `command not found` or `event not found` when running `claude plugin ...` | You typed a shell command at the wrong place, or with a leading `!` | Run it in a normal terminal, without `!` |
| `/turma:tickets` stops with "no GitHub remote" | The repo has no `origin` | Run the `gh repo create ...` command it prints, then re-run |
| `/turma:tickets` stops on auth | `gh` lacks the `project` scope | `gh auth refresh -s project` |
| `/turma:tickets` or `/turma:work` says the design is not accepted or not pushed | Tickets link to files on GitHub, so they must be approved and pushed first | Approve in `/turma:design`, then commit and push |
| `/turma:design` refuses to start | The README or problem doc still lists Open questions | Answer them (re-run `/turma:init` or `/turma:define`) |
| `/turma:work` refuses to start | Another ticket is `In Progress`, or the working tree is dirty | Finish or reset the other ticket; commit or stash your changes |
| A read is blocked as "outside this repo" | The read-outside-repo hook | Add the folder to `TURMA_READ_ALLOW`, or set `TURMA_READ_OUTSIDE=request` |
| `bootstrap` wrote nothing | Its concrete provisioning report has not been approved | Reply with approval or changes |
| Codex skills do not appear | The plugin is not installed or the session predates installation | Install the local checkout and open a new session |
| Codex hooks do not run | Project configuration or hook definitions are not trusted | Review the project and `/hooks`; generated configuration alone is not activation |

## Updating

Claude Code:

```bash
claude plugin marketplace update veve
claude plugin update turma@veve
```

Codex: refresh/reinstall the plugin from its marketplace using the installed Codex
version's plugin management interface, then open a new session. Installed plugins
may be cached; editing the source checkout alone does not refresh that cached copy.

Projects keep their copied scripts. Re-run bootstrap for the installed hosts to
refresh them, and review changed Codex hooks through `/hooks` again.

## Contributing

Edit `plugin.json` for shared plugin metadata and version. Generate both host
manifests, Claude entrypoints, Codex skill metadata and the catalog version; do not
edit those derived values separately.

Add a catalog file and one registry entry whose `grounds` names a real need. Mark
host-specific entries with `hosts: ["claude"]` or `["codex"]`. The historical
`claude-md/*` registry IDs remain stable for existing decision logs, while their
shared files live under `catalog/instructions/`.

Keep procedures in one shared file. Claude agent wrappers and Codex skills should
refer to that procedure. Read `references/runtime.md` before changing bootstrap paths.
The generator preserves explicit invocation for existing workflows; the review
skill's `metadata.invocation: automatic` enables normal discovery in both hosts.

```bash
node scripts/build-plugin.mjs
node scripts/build-readme.mjs
node scripts/check.mjs
node --test scripts/test.mjs
```

`check.mjs` validates catalog coverage, generated packaging, both hosts' skill
resources and hook wiring, README tables, and append-only decisions. Set
`TURMA_REPOS=/path/a:/path/b` to verify installed copies in either state layout.
`TURMA_HOME=/path/to/test-data` selects an isolated decisions directory for validation.
Tests use temporary repositories and hook payloads, with no GitHub calls or pushes.
They do not replace a live smoke test in each assistant after installation.

## License

MIT. See `LICENSE`.
