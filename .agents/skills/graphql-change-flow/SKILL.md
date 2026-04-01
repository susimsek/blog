---
name: graphql-change-flow
description: Handle GraphQL changes for this Go + Next.js blog. Use when touching internal/graphql/**, gqlgen.yml, admin-gqlgen.yml, codegen.ts, api/graphql/**, api/admin-graphql/**, or frontend/backend GraphQL schema-dependent code.
---

# GraphQL Change Flow

This repo has two Go GraphQL surfaces:

- Public GraphQL: `internal/graphql/**`, `gqlgen.yml`, `api/graphql/**`
- Admin GraphQL: `internal/graphql/admin/**`, `admin-gqlgen.yml`, `api/admin-graphql/**`

There is also frontend TypeScript GraphQL codegen via `codegen.ts`.

## Rules

- Treat `internal/graphql/schema.graphqls` and `internal/graphql/admin/schema.graphqls` as source files.
- Treat generated Go files under `internal/graphql/**/generated.go` and `internal/graphql/**/model/models_gen.go` as outputs. Do not hand-edit them.
- Follow the GraphQL naming rules defined in `AGENTS.md` when a change touches schema contracts or operation documents.

## Steps

1. Edit schema, resolver, helper, or handler code.
2. If the change renames fields, inputs, enums, scalars, or operation documents, update all affected Go resolvers, frontend callers, generated artifacts, and tests in the same pass.
3. Run `pnpm run graphql:generate` when gqlgen-managed schema, bindings, or config changed.
4. Run `pnpm run graphql:codegen` when frontend GraphQL types or operations need refreshing.
5. Run `pnpm run backend:lint` and `pnpm run backend:test`.
6. Add `pnpm run typecheck` when frontend TypeScript GraphQL consumers changed.

## Notes

- Handler-only changes in `api/graphql/**` or `api/admin-graphql/**` may not require regeneration if bindings did not change.
- Schema changes usually mean regenerate first, then verify.
- For legacy areas, prefer incremental alignment over large schema-wide renames unless the user explicitly wants a breaking contract cleanup.
