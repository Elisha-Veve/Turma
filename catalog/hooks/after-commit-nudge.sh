#!/usr/bin/env bash
# PostToolUse hook for Bash. Installed via the settings/hook-wiring fragment.
#
# When Claude has just run `git commit`, the post-commit hook has already queued
# the commit. This adds a one-line reminder into Claude's context that the queue
# grew and turma:optimize is the thing to run. It does not run the analysis.
set -uo pipefail

cmd=$(jq -r '.tool_input.command // ""' 2>/dev/null) || exit 0
printf '%s' "$cmd" | grep -qE '(^|[;&|(]|&&|\|\|)[[:space:]]*git[[:space:]]+commit' || exit 0

dir="${CLAUDE_PROJECT_DIR:-$PWD}/.claude"
queue="$dir/optimizer-queue.log"
pending=0
[ -f "$queue" ] && pending=$(grep -c . "$queue" 2>/dev/null || echo 0)

printf '{"hookSpecificOutput":{"hookEventName":"PostToolUse","additionalContext":"This commit was queued for turma:optimize; %s commit(s) now await review. Run /turma:optimize when it is a good moment - it will not interrupt anything."}}' "$pending"
exit 0
