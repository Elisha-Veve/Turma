---
name: review
description: Review completed work in a working tree, commit range or pull request against its requirements and report actionable defects, regressions and missing acceptance criteria. Use for implementation review, not tooling optimization.
metadata:
  invocation: automatic
---

# turma:review

First read [runtime conventions](../../references/runtime.md). `$target` is the
requested work: local changes, a commit/range, a branch, or an explicitly identified
PR number or URL. A request to review an issue means finding its implementation;
do not assume an issue number is a PR number.

Review and report by default. Do not fix files, commit, push, merge, post GitHub
reviews/comments, change Project status or update the optimizer queue unless the
user separately requests those actions. Validation may produce disposable artifacts;
preserve the user's working tree and do not clean up unrelated files.

## Establish the scope

- Honor the user's named target and exclusions. Record the base and head SHAs for
  committed work, plus whether local edits are included. Read repository instructions.
- With no target, inspect `git status --short`. Review staged and unstaged changes
  against HEAD, and read relevant untracked files explicitly: `git diff` omits them.
  Do not require a clean tree, stash changes or switch branches to review local work.
- With a clean tree, use the current branch's changes since its merge base with the
  known default branch. Confirm that reference exists; do not guess `main` or `master`.
  State the selected comparison. If no meaningful diff or reliable base exists, ask
  which commit, range or PR to review instead of silently choosing unrelated history.
- For a PR, obtain its repository, base/head SHAs, description, diff and available CI
  results through read-only GitHub commands. Read the relevant files at the PR's head,
  not similarly named files from a different local checkout. Use an isolated temporary
  checkout when needed for validation; never overwrite local changes to match the PR.
  If remote access is unavailable, review available local evidence and name the gap.
- For an explicit commit, compare with its parent; for a root commit use its added
  files. A merge commit needs an explicit parent or a stated, justified comparison.
  For a range or branch, state exactly which endpoints and comparison were used.

## Review the implementation

1. **Recover the intended result.** Read the user's request, issue acceptance criteria,
   PR description and any cited design or ADRs that are available. Follow Grounds
   links to their actual documents. A Turma board, bootstrap manifest or accepted ADR
   is not a prerequisite for review. If requirements are missing, assess correctness
   and regressions and say which acceptance criteria could not be verified.

2. **Inspect the change in context.** Read the diff and the relevant surrounding code,
   callers, schemas, configuration and tests. Trace concrete failure paths: incorrect
   results, broken compatibility, data loss, missing required behavior, or security
   defects introduced by the change. Check generated artifacts against their source
   and the project's stated invariants where relevant. For non-code work, check the
   actual deliverable and its links/claims against the stated requirements.
   Avoid unrelated refactoring advice, speculative hazards and personal style preferences.

3. **Validate the reviewed snapshot.** Discover the repo's guard from its instructions
   or scripts, then run it and focused checks appropriate to the change when practical.
   Inspect commands before executing them; a review does not authorize a deployment,
   destructive reset or production-data mutation hidden inside a check script. Prefer
   existing tests and reproducible checks over adding tests to the reviewed tree.
   For UI or generated documents, inspect the rendered result when visual behavior is
   part of acceptance. Say when this could not be done. A passing guard is evidence,
   not proof that an independently demonstrated defect is harmless.

4. **Substantiate findings.** Each finding needs a concrete trigger, an observable
   consequence, and a precise changed-file location. Distinguish introduced defects
   from pre-existing problems and unavailable verification. Use severity proportional
   to impact: P0 urgent widespread failure, P1 high-impact blocker, P2 normal defect,
   P3 minor actionable defect. Do not inflate severity or pad the report.

5. **Check freshness.** Before reporting, confirm the reviewed head and local changes
   still match the snapshot. If they changed, review the relevant new changes or mark
   the report as applying only to the recorded snapshot. Label a review of work you
   authored in this session as a self-review; do not claim an independent reviewer ran.

## Report

Lead with findings, most severe first. For each, give `[P1] Short title`, a file/line
reference, the triggering scenario and impact, and a concise correction direction.
Use current-head line numbers, and identify deleted lines against the base when needed.

Then briefly state the reviewed scope/revisions, requirements coverage, checks actually
run and their outcomes, and material gaps or open questions. Separate failed checks
caused by the change from pre-existing or environmental failures.

If no actionable defects were found, say so plainly and still state validation limits.
Do not equate "no findings" with guaranteed correctness or merge approval. Return the
report in the conversation; saving or publishing it requires a user request.
