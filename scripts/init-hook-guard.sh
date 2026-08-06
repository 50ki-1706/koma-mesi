#!/bin/bash
set -euo pipefail

# Devbox shell init_hook guard.
# Runs the project setup only in contexts where the cocogitto hook should be
# installed: interactive shells, explicitly signaled environments, or when a
# Devbox run command targets cocogitto.
#
# The DEVBOX_RUN_CMD check depends on an internal Devbox variable observed in
# version 0.17.2. CI and lock files must keep Devbox pinned to that version, or
# this guard may silently skip setup for cog subcommands.

main() {
  local run_setup=0

  # Normal interactive devbox shell: stdin is a TTY.
  if [ -t 0 ]; then
    run_setup=1
  fi

  # Explicit opt-in via environment variable.
  if [ -n "${COCOGITTO_INIT_HOOK:-}" ]; then
    run_setup=1
  fi

  # Devbox 0.17.2 sets DEVBOX_RUN_CMD to the invoked command. Treat "cog" and
  # any cog subcommand (e.g. "cog verify") as a signal to run setup.
  case "${DEVBOX_RUN_CMD:-}" in
    cog|cog\ *) run_setup=1 ;;
  esac

  if [ "$run_setup" -eq 0 ]; then
    exit 0
  fi

  echo 'Devbox shell started'
  ./scripts/setup.sh
}

main "$@"
