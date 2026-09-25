#!/usr/bin/env bash
# SessionEnd advisory notification. Shared by Claude Code and Codex.
set -uo pipefail
source "$(dirname "${BASH_SOURCE[0]}")/turma-paths.sh"
payload=$(cat)
root=$(turma_root "$(printf '%s' "$payload" | jq -r '.cwd // empty' 2>/dev/null)")
dir=$(turma_state_dir "$root")
queue="$dir/optimizer-queue.log"
[ -f "$queue" ] || exit 0
pending=$(awk 'NF { n++ } END { print n+0 }' "$queue")
[ "$pending" -gt 0 ] || exit 0
message="$pending commit(s) await review. Ask to run Turma optimize."
# Use arguments, not repository names interpolated into AppleScript source.
if command -v osascript >/dev/null 2>&1; then
  osascript - "$message" <<'APPLESCRIPT' >/dev/null 2>&1 || true
on run argv
  display notification (item 1 of argv) with title "Turma"
end run
APPLESCRIPT
elif command -v notify-send >/dev/null 2>&1; then
  notify-send Turma "$message" >/dev/null 2>&1 || true
else
  printf '%s\n' "$message" >&2
fi
exit 0
