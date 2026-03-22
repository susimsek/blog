---
name: code-change-verification
description: Run the required local verification stack for this repo before handoff. Use when runtime code, tests, generated artifacts, content-driven output, or build/test behavior changed.
---

# Code Change Verification

Use this skill before marking work complete when the task changed repo state that can affect behavior.

## Steps

1. Invoke `$release-gates` to choose the minimum required command set.
2. If GraphQL schema, bindings, or codegen changed, invoke `$graphql-change-flow` first.
3. Run every selected command from the repository root.
4. If you fix code after a failure, rerun the affected commands.
5. In the final handoff, state what you ran and what you intentionally skipped.

## Rule

- Do not mark the work complete before the selected verification stack finishes.
- Prefer the minimum sufficient stack.
