#!/usr/bin/env bash
# Shared by Git hooks, assistant hooks and the checker. Sourcing this file is inert.
turma_root() {
  git -C "${1:-${CLAUDE_PROJECT_DIR:-$PWD}}" rev-parse --show-toplevel 2>/dev/null || printf '%s\n' "${1:-${CLAUDE_PROJECT_DIR:-$PWD}}"
}

# State lives with the main checkout. A linked worktree (git worktree add, or Claude Code's
# .claude/worktrees/agent-*) shares the main checkout's .git, so its commits belong in that
# queue, not in the worktree's own copy of the state directory, where nothing reads them.
# REPO stays per worktree (turma_root): it is the checkout being worked in.
turma_state_root() {
  local d="${1:-${CLAUDE_PROJECT_DIR:-$PWD}}" common
  common=$(git -C "$d" rev-parse --path-format=absolute --git-common-dir 2>/dev/null) || { turma_root "$d"; return; }
  case "$common" in
    */.git) dirname "$common" ;;
    *) turma_root "$d" ;;
  esac
}

turma_state_dir() {
  local root
  root=$(turma_state_root "${1:-${CLAUDE_PROJECT_DIR:-$PWD}}")
  # Keep established Claude projects on their original state, including old Git hooks.
  if [ -f "$root/.claude/turma-manifest.json" ] || [ -f "$root/.claude/optimizer-queue.log" ] || [ -f "$root/.claude/optimizer-state.json" ]; then
    printf '%s\n' "$root/.claude"
  else
    printf '%s\n' "$root/.turma"
  fi
}

turma_home() {
  if [ -n "${TURMA_HOME:-}" ]; then
    printf '%s\n' "$TURMA_HOME"
  elif [ -d "$HOME/.claude/turma" ]; then
    printf '%s\n' "$HOME/.claude/turma"
  else
    printf '%s\n' "$HOME/.turma"
  fi
}

if [ "${BASH_SOURCE[0]}" = "$0" ]; then
  case "${1:-}" in
    root) turma_root "${2:-$PWD}" ;;
    state) turma_state_dir "${2:-$PWD}" ;;
    home) turma_home ;;
    *) echo 'Usage: turma-paths.sh root|state [repo] | home' >&2; exit 2 ;;
  esac
fi
