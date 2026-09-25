#!/usr/bin/env bash
# PreToolUse guard for Read, Grep and Glob.
#
# In accept-edits / auto mode, Claude Code reads files outside the working repo
# without a prompt. This blocks a Read/Grep/Glob whose target resolves outside the
# repo, unless the target is on the allow list.
#
# Allow list (each entry matches itself and everything under it):
#   - the repo itself (CLAUDE_PROJECT_DIR)
#   - $TURMA_HOME (default ~/.claude/turma)  the user log and overlay catalog; the plugin
#     cache itself lives under ~/.claude, so it is covered by the entry below
#   - ~/.claude                    memory, settings, the plugin cache
#   - $TMPDIR, /tmp, /private/tmp  scratch space
#   - anything in TURMA_READ_ALLOW (colon-separated, appended to the above)
#
# TURMA_READ_OUTSIDE=request turns the block into a permission prompt instead of a
# hard deny. Default is deny - the same decision as no-build-over-dev-server: a hook
# that only warns is ignored in the mode that needs it.
#
# Known gap: a read via `cat`/`head` in a Bash call is not covered here.
set -uo pipefail

source "$(dirname "${BASH_SOURCE[0]}")/turma-paths.sh"
repo=$(turma_root)

p=$(jq -r '.tool_input.file_path // .tool_input.path // ""' 2>/dev/null) || exit 0
# Grep/Glob with no path default to the repo root - nothing to check.
[ -n "$p" ] || exit 0

normalize() {
  local path="$1" abs seg out=() IFS=/
  case "$path" in
    /*)    abs="$path" ;;
    "~")   abs="$HOME" ;;
    "~/"*) abs="$HOME/${path#"~/"}" ;;
    *)     abs="$repo/$path" ;;
  esac
  for seg in $abs; do
    case "$seg" in
      ''|.) ;;
      ..) [ ${#out[@]} -gt 0 ] && unset 'out[${#out[@]}-1]' ;;
      *) out+=("$seg") ;;
    esac
  done
  printf '/%s' "${out[@]}"
}

target=$(normalize "$p")

allow=("$repo" "$HOME/.claude" "$(turma_home)" "/tmp" "/private/tmp")
[ -n "${TURMA_HOME:-}" ] && allow+=("$TURMA_HOME")
[ -n "${TMPDIR:-}" ] && allow+=("${TMPDIR%/}")
if [ -n "${TURMA_READ_ALLOW:-}" ]; then
  IFS=: read -r -a extra <<< "$TURMA_READ_ALLOW"
  allow+=("${extra[@]}")
fi

for a in "${allow[@]}"; do
  [ -n "$a" ] || continue
  na=$(normalize "$a")
  if [ "$target" = "$na" ]; then exit 0; fi
  case "$target/" in "$na/"*) exit 0 ;; esac
done

decision=deny
[ "${TURMA_READ_OUTSIDE:-deny}" = "request" ] && decision=ask

jq -n --arg decision "$decision" --arg reason "$target is outside this repo. Add its directory to TURMA_READ_ALLOW, or set TURMA_READ_OUTSIDE=request to ask before the read." \
  '{hookSpecificOutput:{hookEventName:"PreToolUse",permissionDecision:$decision,permissionDecisionReason:$reason}}'
exit 0
