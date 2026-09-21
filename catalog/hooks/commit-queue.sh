#!/usr/bin/env bash
# git post-commit hook. Installed by turma:bootstrap as <repo>/.git/hooks/post-commit
# (or appended to an existing one).
#
# Records every commit so turma:optimize knows what is new since its last run.
# A person's commits and Claude's both pass through here; a Claude Code hook
# would only ever see Claude's.
#
# The queue is the source of truth for "what has not been reviewed". turma:optimize
# truncates it when it finishes. optimizer-queue.log is gitignored.
set -uo pipefail

root=$(git rev-parse --show-toplevel 2>/dev/null) || exit 0
dir="$root/.claude"
[ -d "$dir" ] || exit 0

sha=$(git rev-parse HEAD 2>/dev/null) || exit 0
when=$(date -u +%Y-%m-%dT%H:%M:%SZ)
branch=$(git rev-parse --abbrev-ref HEAD 2>/dev/null || echo '?')
subject=$(git log -1 --pretty=%s 2>/dev/null || echo '')

printf '%s\t%s\t%s\t%s\n' "$sha" "$when" "$branch" "$subject" >> "$dir/optimizer-queue.log"
exit 0
