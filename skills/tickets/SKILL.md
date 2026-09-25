---
name: tickets
description: Break an approved system design into GitHub Issues on this repo's GitHub Project board, each one grounded in the design section it implements, and hold the whole batch for approval before anything is created on GitHub.
---

# turma:tickets

First read [runtime conventions](../../references/runtime.md) and resolve the project
and state paths. Preserve the user's existing authorization and constraints.

Read `$design` - the topic doc and/or ADRs `turma:design` produced (a path, or enough
of a description to find them under `docs/`) - and turn it into GitHub Issues on this
repo's Project board. This is gate #2: every `gh` command that creates or changes
something on GitHub is listed in a report first, and none of them runs before you
approve it.

`catalog/doc-templates/github-issue-body.md` is the only template
this skill uses. The issues, labels and Project themselves belong to this repo, on
GitHub - Turma keeps no ticket log of its own. Use `gh ...  --jq '...'` (the flag `gh` ships, not a piped
external `jq`) so this works without assuming `jq` is installed.

## Context

Read `catalog/doc-templates/github-issue-body.md`. Inspect the GitHub remote, `gh auth
status`, repository owner/name/default branch, labels and Projects using `gh` JSON
output. Read `STATE/turma-manifest.json` for an existing `githubProject` pointer.

## Steps

1. **Require a design that was actually accepted.** Every topic doc and ADR `$design`
   points at must have `Status: accepted` (or `accepted-with-limitation`). If any is
   still `proposed` or missing, stop - send the user back to `/turma:design`.

2. **Require the design to be pushed.** `git log origin/<default-branch>..HEAD -- <the
   design files>` must be empty. A ticket's Grounds link is pinned to the default branch
   at creation time; a link to an unpushed file is a link to nothing the moment anyone
   opens it on GitHub. If it fails, tell the user to push and stop.

3. **Require a GitHub remote.** If `git remote get-url origin` fails or is not a GitHub
   URL, stop. Print the exact fix - `gh repo create <name> --source=. --remote=origin
   --push` (the user picks `--public`/`--private`) - and do nothing else. This is
   a common starting point for a new repo; do not improvise infrastructure around it.

4. **Require the `project` auth scope.** If `gh auth status` does not list it, print
   `gh auth refresh -s project` and stop.

5. **Find or plan the Project.** One Project per repo, titled exactly `<repo>`. If
   `STATE/turma-manifest.json` names one, confirm it still resolves (`gh project view
   <number> --owner <owner>`); if not, or none is recorded, check `gh project list
   --owner <owner>` for a title match. If truly none exists, the report proposes
   creating one (`gh project create --owner <owner> --title "<repo>"`, then `gh project
   link <number> --owner <owner> --repo <owner>/<repo>`) - a real, visible action, shown
   in the report, never done silently. Never create a second Project for a repo that
   already has one recorded and resolvable.

6. **Slice the design into tickets.** Each ticket is one independently shippable unit,
   sized to finish in one `/turma:work` run - usually one per ADR, or one per numbered
   implementation step in a topic doc if an ADR is bigger than one PR's worth. For each,
   fill `catalog/doc-templates/github-issue-body.md`:
   - **Grounds** - an absolute blob URL, never a relative link (a GitHub Issue is not
     rendered in the context of a repo path, so a relative link 404s from the Issues
     tab): `https://github.com/<owner>/<repo>/blob/<default-branch>/docs/decisions/NNNN-<slug>.md`
     or `.../blob/<default-branch>/docs/<topic>.md#<section-anchor>`. A ticket that
     cannot fill this with a real link is not a ticket yet - go back to `turma:design`,
     do not invent scope to fill the gap.
   - Scope, acceptance criteria, out of scope, and the repo's guard command.

7. **Match labels to what exists.** Use only labels `gh label list` actually returned.
   If a ticket needs one the repo lacks, the report proposes `gh label create "<name>"
   --description "<...>" --color "<hex>"` rather than silently substituting.

8. **Write the report:** a table of every ticket - title, labels (existing vs.
   to-be-created), Grounds link - followed by the literal `gh` commands that will run,
   in order: any `gh label create`, then `gh project create`/`gh project link` if
   needed, then a `gh project field-create` if the Status field is missing (checked via
   `gh project field-list <n> --owner <o> --format json`), then one `gh issue create`
   and one `gh project item-add` per ticket.

9. **Wait for approval.** No `gh` command that creates or edits anything on GitHub runs
   before this.

10. **On approval, run the commands from the report, in order.** Create missing labels.
    Create/link the Project only if none was found. Create the `Status` field
    (`SINGLE_SELECT`, options `Todo,In Progress,In Review,Done`) only if missing. For
    each ticket: write its body to a scratch file, `gh issue create --repo <owner>/<repo>
    --title "<title>" --body-file <path> --label "<labels>"`, capture the printed issue
    URL, then `gh project item-add <number> --owner <owner> --url <issue-url>`.

11. **Record the Project pointer.** Merge `{"githubProject": {"owner", "number",
    "title", "url"}}` into `STATE/turma-manifest.json` (read it first; do not clobber
    other fields). Nothing else about the tickets is recorded locally - GitHub is the
    log.

12. **Print the board URL** and the first ticket's issue number, with `/turma:work
    <issue-number>` as the next command.

## Rules

- A ticket without a Grounds line to a specific, pushed design section is not created -
  it is flagged back to `turma:design`.
- Never create a second Project for a repo that already has one recorded and resolvable.
- Never invent a label; propose creating the real one.
- No `gh` command that mutates GitHub state runs before the report is approved.
