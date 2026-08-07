---
name: create-pr
description: Create a Pull Request with a Conventional Commits title following the repository's PR rules. Use when finishing work on a branch and ready to submit for review.
---

# Create PR

Create a Pull Request that follows the repository's PR rules.

## Workflow

1. Read `docs/pr-rules.md` completely. Treat it as the source of truth.
2. Verify preconditions:
   - The current branch is not `main`.
   - There are committed changes on the branch (not uncommitted).
   - If uncommitted changes exist, warn the user and stop.
3. Determine the base branch: always `main`.
4. Inspect the changes on the branch (e.g., `git diff main --stat` and `git log main..HEAD`) to understand what was done.
5. Select the most appropriate Conventional Commits type from the allowed types in `docs/pr-rules.md`.
6. Compose the PR title: `<type>(<optional-scope>): <description>`
   - Description starts with a lowercase letter, no trailing period, imperative mood.
   - Keep it 50 characters or fewer.
7. Compose the PR body using the exact template headings from `.github/pull_request_template.md`:
   - `## Summary` — what changed
   - `## Why` — why this change is needed
   - `## Validation` — test results and verification steps
   - `## Review Points` — areas that need careful review
8. Validate the PR title:
   - Type must be one of: feat, fix, docs, style, refactor, perf, test, build, ci, chore, revert.
   - Format must match: `<type>(<scope>): <description>` or `<type>: <description>` (scope optional).
   - Breaking change `!` is allowed after type/scope.
9. Check if a PR already exists for this branch (`gh pr view` or equivalent). If yes, show the existing PR and stop.
10. Preview the PR title and body to the user for confirmation.
11. Only after user confirmation, create the PR:
    - Use `gh pr create --title "<title>" --body "<body>" --base main` if `gh` CLI is available and permitted.
    - If `gh` is unavailable or not permitted, output the exact `gh pr create` command for the user to run manually.

## Title Validation Rules

- Must start with a valid type from `cog.toml`.
- Parenthesized scope is optional but must be lowercase if present.
- A colon and space `: ` must separate type/scope from description.
- Description must be lowercase-starting, no trailing period, imperative mood.
- Total title should be 50 characters or fewer (excluding scope if very long).
- Breaking change marker `!` is allowed before the colon.

## Non-Goals

- Do not modify the PR template.
- Do not modify CI configuration.
- Do not push commits or create branches — only create the PR.

## Examples

Input: Branch `feature/123-add-user-auth` with new auth pages and API routes.
Title: `feat: add user authentication`

Input: Branch `fix/456-prevent-duplicate-orders` with a bug fix in order service.
Title: `fix(order): prevent duplicate order creation`

Input: Branch `docs/update-pr-rules` with documentation changes only.
Title: `docs: update PR creation and operation rules`
