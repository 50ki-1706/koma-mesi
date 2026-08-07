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

# Check git user configuration before installing the hook.
# cocogitto requires both user.name and user.email to be set; otherwise
# `cog install-hook` panics in environments such as GitHub Actions.
GIT_USER_NAME=$(git config user.name 2>/dev/null || true)
GIT_USER_EMAIL=$(git config user.email 2>/dev/null || true)

if [ -z "$GIT_USER_NAME" ] || [ -z "$GIT_USER_EMAIL" ]; then
  if [ -n "${CI:-}" ] || [ -n "${GITHUB_ACTIONS:-}" ]; then
    echo "Warning: git user.name and/or user.email is not configured in CI."
    echo "Setting temporary values so cocogitto can install the hook..."

    if [ -z "$GIT_USER_NAME" ]; then
      if ! git config user.name "CI"; then
        echo "Warning: Failed to set git user.name. Skipping hook installation."
        SKIP=true
      fi
    fi

    if [ -z "$GIT_USER_EMAIL" ] && [ "${SKIP:-false}" != true ]; then
      if ! git config user.email "ci@github-actions.localhost"; then
        echo "Warning: Failed to set git user.email. Skipping hook installation."
        SKIP=true
      fi
    fi

    if [ "${SKIP:-false}" != true ]; then
      GIT_USER_NAME=$(git config user.name 2>/dev/null || true)
      GIT_USER_EMAIL=$(git config user.email 2>/dev/null || true)
      if [ -z "$GIT_USER_NAME" ] || [ -z "$GIT_USER_EMAIL" ]; then
        echo "Warning: git user.name/user.email still not configured after write attempt. Skipping hook installation."
        SKIP=true
      fi
    fi
  else
    echo "Warning: git user.name and/or user.email is not configured."
    echo "Set them with:"
    echo "  git config user.name \"Your Name\""
    echo "  git config user.email \"your.email@example.com\""
    echo "Skipping hook installation."
    SKIP=true
  fi
fi

# Install the hook using cocogitto
if [ "${SKIP:-false}" != true ]; then
  echo "Installing cocogitto commit-msg hook..."
  if cog install-hook commit-msg; then
    echo "Success: commit-msg hook installed at $HOOK_PATH"
    echo "Conventional commit messages are now enforced."
  else
    echo "Error: Failed to install commit-msg hook."
    exit 1
  fi
fi
