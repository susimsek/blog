# AI Agent Guidelines

This repo is a multilingual blog platform with a **Next.js static-export frontend** and a **Go backend** for GraphQL, GraphiQL, newsletter confirmation, and newsletter dispatch.

Tech stack: Next.js 16, React 19, TypeScript, Redux Toolkit, i18next + react-i18next, Bootstrap/Sass, Go 1.24, gqlgen, MongoDB driver, ESLint (flat config), Jest + Testing Library, SonarCloud.

For backend architecture, prefer a layered Go package structure similar in spirit to the frontend's clear separation of responsibilities. Do not introduce new feature-first Go package layouts.

## Agent MCP Usage Guidelines

- Always use the Context7 MCP server when you need library/API documentation without the user having to explicitly ask.
- Typical libraries in this repo: Next.js, React, TypeScript, Redux Toolkit, i18next/react-i18next, Jest, Testing Library, gqlgen, GraphQL, and Bootstrap/Sass.

### Mandatory Skill Usage

#### `$code-change-verification`

Run `$code-change-verification` before handoff when changes affect runtime code, tests, generated artifacts, static output behavior, or build/test behavior.

Use it for changes under `src/`, `api/`, `internal/`, `pkg/`, `cmd/`, `scripts/`, `__tests__/`, `content/posts/`, `public/data/`, `public/locales/`, and root build/test/config files such as `package.json`, `tsconfig*.json`, `eslint.config.*`, `jest.config.*`, `next.config.*`, `.golangci.yml`, `gqlgen.yml`, `admin-gqlgen.yml`, or `codegen.ts`.

Skip it for docs-only or repo-meta changes such as `.codex/`, `README.md`, `AGENTS.md`, or `.github/`, unless the user explicitly asks for full verification.

#### `$changeset-validation`

This repo does not use `.changeset/`. In this repo, run `$changeset-validation` when a change affects user-visible behavior, synchronized content or i18n metadata, generated GraphQL artifacts, or release-sensitive build/deploy behavior.

Use it to confirm required sync/codegen steps were considered and to produce a Conventional Commit-style impact summary for non-trivial changes.

## Repo Skills

- Repo-local skills live under `.agents/skills/`.
- `$blog-content-authoring`: posts, indexes, locale content, thumbnails
- `$graphql-change-flow`: GraphQL schema/resolver/codegen changes
- `$release-gates`: minimum verification command selection
- `$code-change-verification`: run the selected verification stack before handoff
- `$changeset-validation`: validate derived artifacts and summarize impact

## Worktree Preference

- Prefer separate git worktrees for parallel or long-running tasks when frontend, backend, or content work would otherwise conflict in one working tree.
- A practical split for this repo is one worktree each for UI, Go/backend, and content-heavy work.

## Quick Reference

| Action                | Command                                                            |
| --------------------- | ------------------------------------------------------------------ |
| Install               | `pnpm install --frozen-lockfile`                                   |
| Frontend dev          | `pnpm dev`                                                         |
| Backend dev           | `pnpm run backend:dev`                                             |
| Local Go backend      | `pnpm run backend:start`                                           |
| Build                 | `pnpm build`                                                       |
| Preview static build  | `pnpm build` then `pnpm dlx serve build`                           |
| Frontend tests        | `pnpm test`                                                        |
| Single Jest file      | `pnpm test -- __tests__/lib/posts.test.tsx`                        |
| Backend lint          | `pnpm run backend:lint`                                            |
| Backend lint report   | `pnpm run backend:lint:report`                                     |
| Go tests              | `pnpm run backend:test`                                            |
| Backend CI            | `pnpm run backend:ci`                                              |
| Lint                  | `pnpm run lint`                                                    |
| Lint fix              | `pnpm run lint:fix`                                                |
| Format                | `pnpm run prettier:format`                                         |
| Format check          | `pnpm run prettier:check`                                          |
| Typecheck             | `pnpm run typecheck`                                               |
| I18n types            | `pnpm run i18n:interface`                                          |
| Sonar scan            | `pnpm run sonar`                                                   |
| Update Medium feed    | `pnpm run fetch:medium`                                            |
| Sync Medium posts     | `pnpm run sync:medium-posts`                                       |
| Sync post metadata    | `pnpm run sync:post-metadata`                                      |
| Sync code filenames   | `pnpm run sync:code-filenames`                                     |
| gqlgen generation     | `pnpm run graphql:generate`                                        |
| TS GraphQL codegen    | `pnpm run graphql:codegen`                                         |
| Backend content sync  | `pnpm run backend:sync-content`                                    |
| Docker Compose deploy | `docker-compose -f deploy/docker-compose/docker-compose.yml up -d` |
| Helm deploy           | `helm install blog deploy/helm/blog`                               |

## Prerequisites

- Node.js: `>= 24.13.0`
- pnpm via Corepack
- Go: `1.24.x`

## Project Structure

- Frontend app/router/UI: `src/app`, `src/views`, `src/components`, `src/lib`, `src/i18n`, `src/styles`
- Frontend state/config: `src/config`, `src/reducers`
- Backend entrypoints: `api/**`, `cmd/app/main.go`
- Backend core: `internal/config`, `internal/domain`, `internal/graphql`, `internal/service`, `internal/repository`
- Shared backend packages: `pkg/**`
- Content and indexes: `content/posts/**`, `public/data/**`, `public/locales/**`
- Deployment: `deploy/**`, `nginx/**`

Preferred Go layering:

- `api/*`: transport and HTTP entrypoints
- `internal/*`: private app config, domain, service, repository, GraphQL internals
- `pkg/*`: reusable shared libraries and helpers

Do not introduce new feature-first Go package trees.

## Static Export

- `next.config.ts` uses:
  - `output: 'export'`
  - `distDir: 'build'`
  - `images.unoptimized: true`
  - Turbopack SVG handling via `@svgr/webpack`
- In development, `next.config.ts` rewrites:
  - `/graphql` -> `NEXT_PUBLIC_DEV_API_ORIGIN/graphql`
  - `/api/:path*` -> `NEXT_PUBLIC_DEV_API_ORIGIN/api/:path*`
- Avoid server-only Next.js patterns in frontend code.

## Backend Runtime

- Start live-reload backend with `pnpm run backend:dev`
- Start one-shot backend with `pnpm run backend:start`
- Local backend runner (`cmd/app/main.go`) also loads `.env.local` when present
- Default port: `8080`
- Override port with `LOCAL_GO_API_PORT`
- Core local endpoints: `/graphql`, `/api/graphql`, `/api/admin/graphql`, `/graphiql`, `/api/newsletter-dispatch`, `/health`
- Admin UI route: `/admin`
- Admin GraphQL security notes:
  - CORS/cookie handling lives in `pkg/web/admingraphql/handler.go`
  - mutation requests require `X-CSRF-Token` (double-submit token)
  - login/refresh operations are CSRF-exempt (`AdminLogin`, `AdminRefreshSession`)
- GraphiQL toggles:
  - `GRAPHIQL_ENABLED`
  - `GRAPHQL_INTROSPECTION_ENABLED`

## Internationalization

- Supported locales: `en`, `tr`
- When adding UI copy:
  - update both `public/locales/en/*.json` and `public/locales/tr/*.json`
- When adding a post:
  - create `content/posts/<locale>/<slug>.md`
  - update `public/data/posts.<locale>.json`
  - update topics/categories indexes if needed

## TypeScript

- Typecheck with `pnpm run typecheck`
- Keep `strict` TypeScript assumptions
- Regenerate i18n types after locale JSON changes:
  - `pnpm run i18n:interface`

## Go Backend

- Module: `suaybsimsek.com/blog-api`
- Go version: `1.24.0`
- GraphQL schema and generated layer live under `internal/graphql`; regenerate with `pnpm run graphql:generate`
- GraphiQL handler lives under `pkg/graphql`
- Backend env/config resolution lives under `internal/config`
- Newsletter logic and templates live under `pkg/newsletter`

### Package structure rule

- Follow layered packages, not feature-first packages
- Keep transport in `api/*`
- Keep business and persistence flow in `internal/*`
- Keep reusable/shared helpers in `pkg/*`
- Avoid creating new feature-rooted package trees for backend code

### Environment

- Frontend commonly uses `NEXT_PUBLIC_BASE_PATH`, `NEXT_PUBLIC_ASSET_PREFIX`, `NEXT_PUBLIC_SITE_URL`, `NEXT_PUBLIC_DEV_API_ORIGIN`, and `NEXT_PUBLIC_API_BASE_URL`
- Backend commonly requires `API_CORS_ORIGIN`, `MONGODB_URI`, `MONGODB_DATABASE`, `SITE_URL`, `GMAIL_SMTP_USER`, `GMAIL_SMTP_APP_PASSWORD`, `CRON_SECRET`, and `NEWSLETTER_UNSUBSCRIBE_SECRET`
- Auth and OAuth flows use the JWT/cookie variables plus `GITHUB_CLIENT_*` and `GOOGLE_CLIENT_*`
- Newsletter sync script may use `NEWSLETTER_SYNC_LOCALES`

For the full variable list and defaults, check `README.md` and `internal/config/*.go`.

## Code Style & Quality Gates

- Lint with ESLint:
  - `pnpm run lint`
  - `pnpm run lint:fix`
- Lint Go with golangci-lint:
  - `pnpm run backend:lint`
  - `pnpm run backend:lint:report`
  - config file: `.golangci.yml`
  - version is pinned in `package.json`
  - prefer low-noise, high-signal rules
  - favor correctness, error handling, modernization, and dead-code checks over comment-enforcement rules
- Format with Prettier:
  - `pnpm run prettier:format`
  - `pnpm run prettier:check`
- EditorConfig:
  - LF
  - no trailing whitespace
  - indent size `2`
- Admin UI standardization:
  - Prefer standard React-Bootstrap components and utilities (`Button`, `Alert`, `Card`, `Spinner`, `Modal`, grid classes/components)
  - Do not add custom width/alignment overrides for these primitives unless a real product requirement cannot be met with Bootstrap defaults
- Agent workflow:
  - After writing code, always run relevant lint command(s) for changed areas before finalizing (at minimum `pnpm run lint` for frontend/TS and `pnpm run backend:lint` for Go/backend changes)
  - Fix lint errors before asking for commit

### Import aliases

- `@/*` -> `src/*`
- `@assets/*` -> `src/assets/*`
- `@components/*` -> `src/components/*`
- `@config/*` -> `src/config/*`
- `@hooks/*` -> `src/hooks/*`
- `@lib/*` -> `src/lib/*`
- `@pages/*` -> `src/pages/*`
- `@reducers/*` -> `src/reducers/*`
- `@styles/*` -> `src/styles/*`
- `@types/*` -> `src/types/*`
- `@views/*` -> `src/views/*`
- `@tests/*` -> `__tests__/*`
- `@root/*` -> repo root

### SonarCloud

- Scanner command: `pnpm run sonar`
- Coverage inputs:
  - `coverage/lcov.info`
  - `coverage/test-report.xml`
  - `coverage/go-cover.out`
  - `golangci-lint-report.xml`
- Current Sonar scope in `sonar-project.properties` includes:
  - `src/**`
  - `api/graphql/**`
  - `internal/**`
  - `pkg/apperrors/**`
  - `pkg/httpapi/**`
  - `pkg/graphql/**`
  - `pkg/newsletter/**`

## Testing Guidelines

- Frontend tests live under `__tests__/`
- Backend tests live next to Go packages as `*_test.go`
- Recommended React test helper:
  - `__tests__/utils/renderWithProviders.tsx`
- Jest config:
  - environment: `jsdom`
  - coverage report directory: `coverage/`
  - sonar test report: `coverage/test-report.xml`
- Jest global coverage thresholds:
  - statements: `95`
  - functions: `95`
  - lines: `95`

### What to run

- Frontend-only change:
  - `pnpm test`
  - `pnpm run lint`
  - `pnpm run typecheck`
- Backend Go change:
  - `pnpm run backend:lint`
  - `pnpm run backend:test`
  - `pnpm run backend:ci`
- Export/build-sensitive change:
  - `pnpm build`
- Sonar-sensitive change:
  - produce coverage
  - `pnpm run sonar`

## Deployment

- Static frontend output lives in `build/`
- Deployment assets live under `deploy/` and `nginx/`
- See `README.md` for deployment commands and environment details

## Pull Request & Commit Guidelines

### General

- Keep changes focused
- Avoid drive-by refactors
- Never commit secrets
- Never commit generated folders like `build/`, `.next/`, or local artifacts like `coverage/`

### Conventional Commits

- `feat`
- `fix`
- `docs`
- `test`
- `chore`
- `perf`
- `refactor`
- `build`
- `ci`
- `style`
- `types`
- `revert`

### Commit format

```text
<type>(<scope>): <short summary>
```

Suggested scopes:

- `content`
- `i18n`
- `seo`
- `ui`
- `routing`
- `redux`
- `backend`
- `graphql`
- `newsletter`
- `build`
- `deploy`

## Common Mistakes to Avoid

- Editing generated folders instead of source files
- Updating only one locale file
- Adding a post/topic without updating indexes
- Forgetting that frontend is static-exported
- Forgetting dev rewrites depend on `NEXT_PUBLIC_DEV_API_ORIGIN`
- Running Sonar without generating `coverage/go-cover.out`
- Assuming GraphQL packages are automatically covered if they are not included in the Go coverage command
