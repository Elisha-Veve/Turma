#!/usr/bin/env bash
# SessionEnd hook. Installed by turma:bootstrap via the settings/hook-wiring fragment.
#
# turma:optimize runs on demand, so a backlog is easy to forget. On the way out of
# a session, if commits sit unreviewed in the queue, a desktop notification names
# the count. Silent when the queue is empty.
set -uo pipefail

dir="${CLAUDE_PROJECT_DIR:-$PWD}/.claude"
queue="$dir/optimizer-queue.log"
[ -f "$queue" ] || exit 0

pending=$(grep -c . "$queue" 2>/dev/null || echo 0)
[ "${pending:-0}" -gt 0 ] 2>/dev/null || exit 0

repo=$(basename "${CLAUDE_PROJECT_DIR:-$PWD}")
plural=s; [ "$pending" -eq 1 ] && plural=''
osascript -e "display notification \"$pending commit$plural not yet seen by turma:optimize. Run /turma:optimize.\" with title \"Turma - $repo\"" >/dev/null 2>&1 || true
exit 0
