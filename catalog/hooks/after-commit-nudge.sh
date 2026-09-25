#!/usr/bin/env bash
# PostToolUse hook for Bash. Installed via the settings/hook-wiring fragment.
#
# When an assistant has just run `git commit`, the post-commit hook has already queued
# the commit. This adds a one-line reminder into the assistant context that the queue
# grew and turma:optimize is the thing to run. It does not run the analysis.
set -uo pipefail

source "$(dirname "${BASH_SOURCE[0]}")/turma-paths.sh"
payload=$(cat)
cmd=$(printf '%s' "$payload" | jq -r '.tool_input.command // .tool_input.cmd // ""') || exit 0
printf '%s' "$cmd" | grep -qE '(^|[;&|(]|&&|\|\|)[[:space:]]*git[[:space:]]+commit' || exit 0

root=$(turma_root "$(printf '%s' "$payload" | jq -r '.cwd // empty')")
dir=$(turma_state_dir "$root")
queue="$dir/optimizer-queue.log"
pending=0
[ -f "$queue" ] && pending=$(awk 'NF { n++ } END { print n+0 }' "$queue")

printf '{"hookSpecificOutput":{"hookEventName":"PostToolUse","additionalContext":"This commit was queued for turma:optimize; %s commit(s) now await review. Ask to run Turma optimize when it is a good moment - it will not interrupt anything."}}' "$pending"
exit 0
