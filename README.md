# Turma

*Turma* is Latin for a cavalry squadron, the smallest unit that manoeuvres together.

A Claude Code plugin that takes a project from an idea to shipped tickets with a human
approving each step. You talk through what the project is, Turma writes the README you
approve, provisions the repo's Claude Code setup, designs the architecture as ADRs you
approve, turns the design into GitHub Issues you approve, and works them one at a time.
An optimizer watches your commits and proposes the agents, skills and hooks that would
have helped.

The idea underneath is one rule, applied to the tooling as well as the code: **a fact is
entered once, and everything derived from it is generated.** A tool definition copied into
several repos becomes several definitions that disagree; Turma keeps each one in one place.

## Install

You need [Claude Code](https://claude.com/claude-code), `git`, and the GitHub CLI (`gh`)
logged in (`gh auth login`). The ticket skills also need the `project` scope, so run this
once:

```bash
gh auth refresh -s project
```

Then install the plugin. **These are shell commands: run them in a normal terminal, not
at the Claude Code prompt.**

```bash
claude plugin marketplace add Elisha-Veve/Turma
claude plugin install turma@veve
```

Restart Claude Code (skills only appear after a restart). Check with
`claude plugin details turma`. From here on, `/turma:...` commands are typed **at the
Claude Code prompt**, inside `claude`.

## Start a project

In an empty repo folder, run `claude`, then:

```
/turma:init "what I want to build"      # discuss it; approve the README it writes
/turma:bootstrap .                      # provision .claude/, hooks, CLAUDE.md
/turma:design                           # architecture as ADRs; approve before it is accepted
/turma:tickets docs/<topic>.md          # GitHub Issues on a Project board; approve the batch
/turma:work                             # implement the next ticket, open a PR
```

Commit after `bootstrap`, and push the design before `/turma:tickets` (Turma prints the
`gh repo create` command when there is no remote; it never creates the repo for you).
For a later feature in an existing project, start at `/turma:define` instead of `init`.

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
would unblock it. Approve, and it runs `git init` if needed and creates `.claude/`, the
hooks, `CLAUDE.md` and a manifest recording what it installed. Then commit, and create the
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

## Keeping the setup current

`/turma:optimize` is the loop that improves your tooling. Every commit is queued by a git
hook. Run `/turma:optimize` after a stretch of work (Turma reminds you after Claude's
commits and when a session ends with commits unreviewed). It reads the queued diffs and
proposes agents, skills or hooks that would have saved effort, each citing the commits
behind it. You accept, defer or reject each one; accepted ones are built, and every ruling
is logged so the next `bootstrap` starts smarter. If nothing is worth adding, it says so.

## The skills

<!-- generated:skills -->
| Skill | What it does |
|---|---|
| `/turma:bootstrap` | Given a project's scope, decide the agents, skills and hooks it needs, show the reasoning, and on approval scaffold them from the Turma catalog. |
| `/turma:define` | Turn a rough problem into a written, expanded problem statement - context, scope, success criteria - through conversation, and save it as this repo's docs/problems/<slug>.md. |
| `/turma:design` | Turn an expanded problem statement into a system design - ADRs numbered from what already exists in docs/decisions/, and a topic doc under docs/ - and hold it for approval before anything downstream depends on it. |
| `/turma:init` | Start a new project from an empty repo - talk through what it is, then write the README.md that turma:bootstrap and turma:design read, after you approve it. |
| `/turma:optimize` | Review the commits since the last run and propose the agents, skills or hooks that would make the next stretch of work faster or safer. |
| `/turma:tickets` | Break an approved system design into GitHub Issues on this repo's GitHub Project board, each one grounded in the design section it implements, and hold the whole batch for approval before anything is created on GitHub. |
| `/turma:work` | Implement one GitHub Issue end to end - read it and the design section it cites, make the change, run this repo's guard, get a second opinion from the repo's auditor agent where one exists, open a PR referencing the issue, and update the issue and its Project status. |
<!-- /generated:skills -->

## The agent

<!-- generated:agents -->
| Agent | What it does |
|---|---|
| `workflow-optimizer` | Reviews recent commits and the session that produced them and proposes the agents, skills or hooks that would have made the work faster or safer. |
<!-- /generated:agents -->

`/turma:optimize` runs it. Turma ships no repo-specific agents; `bootstrap` and
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
Every commit is recorded by a git `post-commit` hook into `.claude/optimizer-queue.log`.
When it suits you, `/turma:optimize` reads the queued diffs for a checker run by hand too
often, work redone, or the same multi-file edit repeated, and proposes what would have
helped. You accept, defer or reject each; every ruling is logged and shapes the next
bootstrap. A one-line nudge after each of Claude's commits, and a notification at session
end when commits are unreviewed, keep the loop visible.

**The hooks** `bootstrap` installs: the commit queue and its two nudges, a guard that
blocks reads outside the repo (`TURMA_READ_ALLOW` widens it, `TURMA_READ_OUTSIDE=request`
prompts instead of denying), and, for Next.js repos, a guard against building over a
running dev server.

## Where your data lives

The plugin directory is read-only; `claude plugin update` overwrites it. Your own data
goes in `TURMA_HOME` (default `~/.claude/turma`):

- `decisions.jsonl` - the append-only log of every ruling.
- `catalog/` - an optional overlay of blocks you added, with its own `registry.json` in the
  same shape as the base one.

Agents and skills you add for use across your repos go in `~/.claude/agents/` and
`~/.claude/skills/`; ones specific to a repo go in that repo's `.claude/`.

## The catalog

`catalog/` is the base set of reusable blocks. `registry.json` indexes every file once
with the real need it answers.

| Directory | Holds |
|---|---|
| `catalog/hooks/` | Shell hooks: the optimizer queue and nudges, the read-outside-repo and build-over-dev-server guards |
| `catalog/patterns/` | Agent and skill skeletons, filled from a repo's real files |
| `catalog/doc-templates/` | Project-README, problem, ADR, design-doc and GitHub-issue-body skeletons |
| `catalog/claude-md/` | CLAUDE.md fragments: the house rule, the planning loop, style rules, a layout skeleton |
| `catalog/settings/` | `settings.json` fragments, deep-merged into a repo's config |

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
| `bootstrap` wrote nothing | It waits for your approval of its table | Reply with approval or changes |

## Updating

```bash
claude plugin marketplace update veve
claude plugin update turma@veve
```

Restart Claude Code. Repos you already bootstrapped keep their copies of the hook
scripts; re-run `/turma:bootstrap` there to refresh them.

## Contributing

Add a block: put the file under the right `catalog/` subdirectory and add one entry to
`registry.json` whose `grounds` names a real file or failure. Add an agent: one `.md`
file in `agents/` with `name`, `description` (the trigger condition, not a job title) and
`tools`. Then bump `version` in `.claude-plugin/plugin.json` and `catalogVersion` in
`catalog/registry.json` together, and run:

```bash
node scripts/build-readme.mjs
node scripts/check.mjs
```

`check.mjs` proves the registry and `catalog/` agree, the versions match, the README
tables are current, your `decisions.jsonl` has only grown, and, for repos you list in
`TURMA_REPOS=/path/a:/path/b`, that the files bootstrap wrote are unedited.

## License

MIT. See `LICENSE`.
