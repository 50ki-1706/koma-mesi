#!/bin/bash
set -euo pipefail

# cocogitto commit-msg hook setup script

# Check if cog is available
if ! command -v cog &> /dev/null; then
  echo "Error: cocogitto (cog) is not available."
  echo "Run this script through Devbox: devbox run -- bash scripts/setup.sh"
  echo "Or activate the Devbox shell first: devbox shell"
  exit 1
fi

# Resolve the hook path (worktree-safe)
HOOK_PATH=$(git rev-parse --git-path hooks/commit-msg)

# Check if commit-msg hook already exists
if [ -f "$HOOK_PATH" ]; then
  # Idempotent fast path: an existing cocogitto hook is already in place.
  if grep -q "cog verify" "$HOOK_PATH"; then
    echo "cocogitto commit-msg hook already installed at $HOOK_PATH"
    exit 0
  fi

  echo "Warning: Existing commit-msg hook found at $HOOK_PATH"
  echo "This will be replaced with cocogitto's hook."
  echo ""
  read -r -p "Continue? [y/yes to proceed, anything else to abort]: " CONFIRM
  if [ "$CONFIRM" != "y" ] && [ "$CONFIRM" != "yes" ]; then
    echo "Aborted. No changes were made."
    exit 0
  fi

  # Create timestamped backup (only after user confirmation)
  TIMESTAMP=$(date +%Y%m%d%H%M%S)
  BACKUP_PATH="${HOOK_PATH}.bak.${TIMESTAMP}"
  cp "$HOOK_PATH" "$BACKUP_PATH"
  echo "Backup created: $BACKUP_PATH"
fi

# Install the hook using cocogitto
echo "Installing cocogitto commit-msg hook..."
if cog install-hook commit-msg; then
  echo "Success: commit-msg hook installed at $HOOK_PATH"
  echo "Conventional commit messages are now enforced."
else
  echo "Error: Failed to install commit-msg hook."
  exit 1
fi
