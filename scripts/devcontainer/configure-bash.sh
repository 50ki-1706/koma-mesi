#!/bin/bash
set -euo pipefail

# Configures the Dev Container remote user's .bashrc to load Devbox shellenv
# automatically in interactive Bash shells, without invoking devbox shell.

resolve_target_rc() {
  local remote_user="${DEVCONTAINER_REMOTE_USER:-devbox}"
  local home_dir=""

  if command -v getent >/dev/null 2>&1; then
    home_dir="$(getent passwd "$remote_user" | cut -d: -f6)"
  fi

  if [ -z "$home_dir" ]; then
    home_dir="${HOME:-/home/$remote_user}"
  fi

  printf '%s\n' "$home_dir/.bashrc"
}

managed_block() {
  printf '%s\n' \
    '# BEGIN next-starter devbox shellenv' \
    'case $- in' \
    '  *i*) ;;' \
    '  *) return ;;' \
    'esac' \
    '' \
    'if [ -z "${NEXT_STARTER_DEVBOX_ENV_LOADED:-}" ]; then' \
    '  if command -v devbox >/dev/null 2>&1; then' \
    '    eval "$(devbox shellenv)"' \
    '    export NEXT_STARTER_DEVBOX_ENV_LOADED=1' \
    '  fi' \
    'fi' \
    '# END next-starter devbox shellenv'
}

main() {
  local target
  target="$(resolve_target_rc)"

  if [ ! -f "$target" ]; then
    touch "$target"
  fi

  local tmp
  tmp="$(mktemp)"

  awk '
    /# BEGIN next-starter devbox shellenv/ { skip=1; next }
    /# END next-starter devbox shellenv/   { skip=0; next }
    skip == 0 { print }
  ' "$target" > "$tmp"

  managed_block >> "$tmp"
  mv "$tmp" "$target"

  printf 'configured: %s\n' "$target"
}

main "$@"
