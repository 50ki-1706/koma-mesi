---
name: commit-msg
description: Write and validate Conventional Commit messages that follow this repository's commit message conventions. Use when creating a commit, reviewing a commit message, or preparing a PR title.
---

# Commit Message

Write Conventional Commit messages that pass the repository's `commit-msg` hook validation.

## Workflow

1. Read `docs/commit-msg.md` completely. Treat it as the source of truth for all commit message rules.
2. Analyze the staged or intended changes to understand their nature and scope.
3. Select the most appropriate type and scope from the documented tables.
4. Write a concise subject line in imperative mood.
5. Add a body when the "why" is not obvious from the diff.
6. Add footers for Issue links or breaking changes when applicable.
7. Validate the message with `cog verify` before committing.

## Type Selection

Pick the single type that best describes the primary purpose of the change:

- `feat` — new user-visible functionality
- `fix` — bug fix
- `docs` — documentation-only changes
- `style` — formatting, whitespace, semicolons (no logic change)
- `refactor` — code restructuring without behavior change
- `perf` — performance improvement
- `test` — adding or updating tests
- `build` — build system or dependency changes
- `ci` — CI configuration changes
- `chore` — miscellaneous maintenance
- `revert` — reverting a previous commit

When a change spans multiple scopes, split into separate commits when possible. If not, omit the scope or use the most impactful one.

## Scope Selection

Use a short module or feature name: `auth`, `api`, `ui`, `db`, `storybook`, `deps`, or a project-specific domain name (e.g., `order`, `user`). Omit the scope when it is unclear.

## Subject Line Rules

- Use imperative mood: "add", "fix", "update", "remove", not "added" or "adds".
- Lowercase, no period at the end.
- Concise and specific.

## Body and Footer

- Body: explain "why" the change was needed, not "what" changed (the diff shows that).
- Footer: use `Closes #123` or `Refs #456` for Issue links.
- Breaking changes: use `!` after the type/scope or add a `BREAKING CHANGE:` footer. Keep breaking changes in an independent commit when possible. Write migration steps in the body.

## Validation

Before committing, validate the message:

```bash
devbox run -- cog verify "feat(auth): add Google OAuth login"
```

The `commit-msg` hook runs `cog verify --file $1` automatically. If rejected, fix the message and retry. Full validation rules are defined in `cog.toml`.

## PR Titles

When a PR is squash-merged, the PR title becomes the final commit message. PR titles must also follow Conventional Commits format.

## Reference

- `docs/commit-msg.md` — full commit message conventions (source of truth)
- `cog.toml` — machine-enforced validation rules
