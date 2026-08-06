-----
title: verify
description: Run the appropriate verification script after code changes.
-----

## What I do

- Run `pnpm verify:frontend` when the change is limited to frontend code.
- Run `pnpm verify` for any other application code change.
- Do not run for changes that only touch `ci.yaml` or documentation files.

## When to use me

- After adding or modifying application code.
- Not after changes limited to `ci.yaml` or `docs/` and so on.

## How I decide

- If the change only affects frontend code, use `pnpm verify:frontend`.
- Otherwise, use `pnpm verify`.
