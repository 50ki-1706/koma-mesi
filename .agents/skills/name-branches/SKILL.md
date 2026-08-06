---
name: name-branches
description: Choose, validate, and create Git branch names that follow this repository's branch naming policy. Use when starting work on a new branch, proposing or reviewing a branch name, or checking whether a human-created branch name is compliant.
---

# Name Branches

Apply the repository's branch naming policy before creating or recommending a branch.

## Workflow

1. Read `docs/branch-naming.md` completely. Treat it as the source of truth.
2. Inspect the requested work and any supplied GitHub Issue number.
3. Select the narrowest matching branch type from the policy.
4. Write a concise English action phrase in lowercase kebab-case.
5. Include the Issue number when the task is linked to an Issue. Never invent a number.
6. Validate the complete name against the policy and show the proposed name to the user when naming is the only requested task.
7. Create the branch with `git switch -c <branch-name>` only when the user asked to create or start a branch.

## Selection Rules

- Prefer the type describing the primary outcome, not every file that may change.
- Use `docs/` for documentation and agent-instruction changes that do not alter application behavior.
- Use `chore/` for repository maintenance that fits no more specific type.
- Start the description with a concrete verb such as `add`, `fix`, `update`, `remove`, `prevent`, or `extract`.
- Keep the description at 50 characters or fewer.
- Do not rename an existing branch unless the user explicitly requests it.
- Do not create a branch from a dirty worktree until existing changes and the intended base are understood.

## Validation Checklist

- Match `<type>/<issue-number>-<description>` when an Issue exists; otherwise match `<type>/<description>`.
- Use only an allowed type from `docs/branch-naming.md`.
- Use ASCII lowercase letters, digits, and single hyphens in the description.
- Reject spaces, underscores, Japanese text, special characters, consecutive hyphens, and leading or trailing hyphens.
- Keep the name specific enough to identify the work without reading the commit history.

## Examples

- With Issue: `feature/123-add-user-authentication`
- Without Issue: `docs/define-branch-naming-rules`
- Invalid: `feature/update` because it is ambiguous.
- Invalid: `feature/add_user-profile` because it contains an underscore.
