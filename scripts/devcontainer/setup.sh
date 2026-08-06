#!/bin/bash
set -euo pipefail

# Dev Container post-create orchestrator.
# Enables idempotent interactive Devbox activation and installs project dependencies.

main() {
  bash scripts/devcontainer/configure-bash.sh
  devbox run -- pnpm install

  echo "devcontainer setup complete"
}

main "$@"
