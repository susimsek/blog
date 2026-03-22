---
name: changeset-validation
description: Validate release-sensitive derived artifacts and summarize impact for this repo. Use when changes affect user-visible behavior, synchronized content/i18n data, GraphQL generation, or build/deploy behavior.
---

# Changeset Validation

This repo does not use `.changeset/`. In this repo, `changeset-validation` means validating that release-sensitive side effects and derived artifacts are covered before handoff.

## Steps

1. Confirm whether derived-file steps were needed:
   - `pnpm run sync:post-metadata`
   - `pnpm run i18n:interface`
   - `pnpm run graphql:generate`
   - `pnpm run graphql:codegen`
2. Confirm the verification stack was selected with `$release-gates`.
3. For content or i18n changes, confirm sync expectations were covered.
4. For GraphQL changes, confirm generated outputs were refreshed when needed.
5. For non-trivial work, produce a Conventional Commit-style impact summary.

## Output

- `Impact:` one Conventional Commit-style summary line
- `Derived artifacts checked:` short list of steps considered or run
- `Risk notes:` only if something user-visible or export-sensitive changed

## Skip

- Skip this skill for repo-meta or docs-only changes.
