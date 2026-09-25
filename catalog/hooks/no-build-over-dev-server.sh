#!/usr/bin/env bash
# PreToolUse guard for Bash. First written for a Next.js project; ports are configurable.
#
# `next build` writes over .next. Doing that while `next dev` serves from the same
# directory leaves the running server with half a build, and every route then 500s
# with "Cannot find module './<chunk>.js'" until it is restarted and .next is
# cleared. Deleting .next outright does the same. Nothing in that message points at
# its cause, so it is worth blocking rather than remembering.
#
# Two things this gets wrong if written naively, both found by using it:
#
#   Matching too widely. A first version looked for the text anywhere in the
#   command and refused a `git commit` whose message merely mentioned the build.
#   Heredoc bodies are dropped first, and a match only counts at a command
#   position: start of line, or after ; && || | or (.
#
#   Detecting the server too widely. `lsof -ti tcp:PORT` reports any socket on that
#   port, including a client connection left behind after the server has gone.
#   -sTCP:LISTEN asks the question actually meant.
#
# Ports: TURMA_DEV_PORTS, then STATE/launch.json, legacy .claude/launch.json, then 3000.
set -uo pipefail

source "$(dirname "${BASH_SOURCE[0]}")/turma-paths.sh"
payload=$(cat)
root=$(turma_root "$(printf '%s' "$payload" | jq -r '.cwd // empty')")
cmd=$(printf '%s' "$payload" | jq -r '.tool_input.command // .tool_input.cmd // ""') || exit 0
[ -n "$cmd" ] || exit 0

stripped=$(printf '%s\n' "$cmd" | awk '
  !inhd && match($0, /<<-?['"'"'"]?[A-Za-z_][A-Za-z0-9_]*['"'"'"]?/) {
    m = substr($0, RSTART, RLENGTH)
    sub(/^<<-?['"'"'"]?/, "", m); sub(/['"'"'"]$/, "", m)
    marker = m; inhd = 1; print; next
  }
  inhd { if ($0 == marker || $0 == "\t" marker) inhd = 0; next }
  { print }
')

if ! printf '%s' "$stripped" | grep -qE \
  '(^|[;&|(]|&&|\|\|)[[:space:]]*(npm[[:space:]]+run[[:space:]]+build|(npx[[:space:]]+)?next[[:space:]]+build|rm[[:space:]]+-[rf]+[[:space:]]+\.?/?\.next)'
then
  exit 0
fi

ports="${TURMA_DEV_PORTS:-}"
for launch in "$(turma_state_dir "$root")/launch.json" "$root/.claude/launch.json"; do
  if [ -z "$ports" ] && [ -f "$launch" ]; then
    ports=$(jq -r '[.configurations[]?.port // empty] | join(" ")' < "$launch")
  fi
done
[ -n "$ports" ] || ports=3000

for port in $ports; do
  if lsof -ti "tcp:$port" -sTCP:LISTEN >/dev/null 2>&1; then
    jq -n --arg reason "A dev server is listening on $port. Stop it before building or clearing .next; changing its build files breaks the running server." \
      '{hookSpecificOutput:{hookEventName:"PreToolUse",permissionDecision:"deny",permissionDecisionReason:$reason}}'
    exit 0
  fi
done
exit 0
