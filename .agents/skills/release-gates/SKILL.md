---
name: release-gates
description: Select the minimum required verification commands for this repo based on changed files. Use before finalizing work in this Next.js static-export + Go backend + content/i18n codebase.
---

# Release Gates

Choose the smallest command set that still validates the changed area. If multiple areas are touched, combine their gates.

## Matrix

- Frontend (`src/**`, `__tests__/**`, `next.config.ts`, `jest.config.js`, `eslint.config.mjs`, `tsconfig.json`):
  `pnpm run lint`, `pnpm run typecheck`, `pnpm test`
- Frontend with export/routing/metadata impact:
  add `pnpm build`
- i18n (`public/locales/**`):
  `pnpm run i18n:interface`, `pnpm run lint`, `pnpm run typecheck`
- Content (`content/posts/**`, `public/data/**`):
  `pnpm run sync:post-metadata` when metadata may drift; add `pnpm build` when static output, RSS, or sitemap may change
- Go backend (`api/**`, `internal/**`, `pkg/**`, `cmd/**`, Go scripts):
  `pnpm run backend:lint`, `pnpm run backend:test`, `pnpm run backend:ci`
- GraphQL:
  also use `$graphql-change-flow`
- Sonar-sensitive work:
  produce coverage inputs, then run `pnpm run sonar`

## Rule

- Prefer the smallest sufficient gate set.
- If unsure whether export behavior changed, include `pnpm build`.
