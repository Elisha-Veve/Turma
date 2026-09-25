#!/usr/bin/env bash
# Called by git post-commit; installed beside turma-paths.sh in STATE/hooks/.
#
# Records every commit so turma:optimize knows what is new since its last run.
# Human, Claude Code and Codex commits all pass through here.
#
# The queue is the source of truth for "what has not been reviewed". turma:optimize
# truncates it when it finishes. optimizer-queue.log is gitignored.
set -uo pipefail

root=$(git rev-parse --show-toplevel 2>/dev/null) || exit 0
source "$(dirname "${BASH_SOURCE[0]}")/turma-paths.sh"
dir=$(turma_state_dir "$root")
[ -d "$dir" ] || exit 0

sha=$(git rev-parse HEAD 2>/dev/null) || exit 0
when=$(date -u +%Y-%m-%dT%H:%M:%SZ)
branch=$(git rev-parse --abbrev-ref HEAD 2>/dev/null || echo '?')
# A rebase replays commits on a detached HEAD. Name the branch being rebased and mark the
# entry as a replay, so turma:optimize can drop the original it supersedes (same patch-id).
for state in rebase-merge rebase-apply; do
  head_name="$(git rev-parse --git-path "$state" 2>/dev/null)/head-name"
  if [ -f "$head_name" ]; then
    branch="$(sed 's|^refs/heads/||' "$head_name") (rebase)"
    break
  fi
done
subject=$(git log -1 --pretty=%s 2>/dev/null || echo '')

printf '%s\t%s\t%s\t%s\n' "$sha" "$when" "$branch" "$subject" >> "$dir/optimizer-queue.log"
exit 0
