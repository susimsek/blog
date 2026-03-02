# AI Agent Guidelines

This repo is a multilingual blog platform with a **Next.js static-export frontend** and a **Go backend** for GraphQL, GraphiQL, newsletter confirmation, and newsletter dispatch.

Tech stack: Next.js 16, React 19, TypeScript, Redux Toolkit, i18next + react-i18next, Bootstrap/Sass, Go 1.24, gqlgen, MongoDB driver, ESLint (flat config), Jest + Testing Library, SonarCloud.

For backend architecture, prefer a layered Go package structure similar in spirit to the frontend's clear separation of responsibilities. Do not introduce new feature-first Go package layouts.

## Table of Contents

1. [Agent MCP Usage Guidelines](#agent-mcp-usage-guidelines)
2. [Quick Reference](#quick-reference)
3. [Prerequisites](#prerequisites)
4. [Project Structure](#project-structure)
5. [Static Export](#static-export)
6. [Backend Runtime](#backend-runtime)
7. [Internationalization](#internationalization)
8. [TypeScript](#typescript)
9. [Go Backend](#go-backend)
10. [Code Style & Quality Gates](#code-style--quality-gates)
11. [Testing Guidelines](#testing-guidelines)
12. [Deployment](#deployment)
13. [Pull Request & Commit Guidelines](#pull-request--commit-guidelines)
14. [Review Process & What Reviewers Look For](#review-process--what-reviewers-look-for)
15. [Common Mistakes to Avoid](#common-mistakes-to-avoid)

## Agent MCP Usage Guidelines

- Always use the Context7 MCP server when you need library/API documentation without the user having to explicitly ask.
- Typical libraries in this repo: Next.js, React, TypeScript, Redux Toolkit, i18next/react-i18next, Jest, Testing Library, gqlgen, GraphQL, and Bootstrap/Sass.

## Quick Reference

| Action                | Command                                                            |
| --------------------- | ------------------------------------------------------------------ |
| Install               | `pnpm install --frozen-lockfile`                                   |
| Frontend dev          | `pnpm dev`                                                         |
| Local Go backend      | `pnpm run backend:start`                                           |
| Build                 | `pnpm build`                                                       |
| Preview static build  | `pnpm build` then `pnpm dlx serve build`                           |
| Frontend tests        | `pnpm test`                                                        |
| Single Jest file      | `pnpm test -- __tests__/lib/posts.test.tsx`                        |
| Backend lint          | `pnpm run backend:lint`                                            |
| Backend lint report   | `pnpm run backend:lint:checkstyle`                                 |
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

### Frontend

- `src/app`: App Router routes, layouts, localized pages
- `src/views`: route-level page components
- `src/components`: shared UI and game components
- `src/config`: store, constants, validation helpers
- `src/reducers`: Redux slices
- `src/lib`: frontend domain helpers, content parsing, metadata, GraphQL client helpers
- `src/i18n`: locale runtime and translation loading
- `src/styles`: global Sass
- `public/locales/<lng>`: translation namespaces

### Backend

- `api/graphql/index.go`: GraphQL + GraphiQL HTTP handler
- `api/newsletter-dispatch/index.go`: newsletter dispatch endpoint
- `internal/config`: private backend env/config resolution
- `internal/domain`: domain entities and shared backend records
- `internal/graphql`: gqlgen schema, generated execution code, resolvers, and mapping helpers
- `internal/service`: business service orchestration
- `internal/repository`: Mongo-backed repository implementations
- `pkg/graphql`: GraphiQL page handler
- `pkg/newsletter`: templates, unsubscribe tokens, status pages, mailer
- `pkg/apperrors`: normalized backend errors
- `pkg/httpapi`: JSON error response helpers
- `cmd/app/main.go`: local backend entrypoint
- `scripts/sync-newsletter-content/main.go`: newsletter content sync utility

Preferred Go layering:

- `api/*`: HTTP transport and entrypoints
- `internal/*`: private app config, domain, service, and repository logic
- `pkg/*`: reusable shared libraries, templates, schemas, and helpers

Do not add new package structures organized mainly by feature domain. Prefer layering by technical responsibility.

### Content

- `content/posts/en/*.md`
- `content/posts/tr/*.md`
- `public/data/posts.<locale>.json`
- `public/data/topics.<locale>.json`
- `public/data/categories.<locale>.json`
- `content/external/medium-feed.json`

### Build and Deploy

- `build/`: generated static output
- `nginx/nginx.conf.template`
- `deploy/docker-compose/docker-compose.yml`
- `deploy/helm/blog`

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

- Start local backend with `pnpm run backend:start`
- Default port: `8080`
- Override port with `LOCAL_GO_API_PORT`
- Local backend endpoints:
  - `/graphql`
  - `/graphiql`
  - `/api/newsletter-dispatch`
  - `/health`
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
- GraphQL schema/resolver work:
  - schema and generated layer under `internal/graphql`
  - regenerate with `pnpm run graphql:generate`
- Backend GraphQL IDE layer:
  - `pkg/graphql/graphiql.go`
- Backend env/config layer:
  - `internal/config/*.go`
- Newsletter email/content helpers:
  - `pkg/newsletter/*`

### Package structure rule

- Follow layered packages, not feature-first packages
- Keep transport in `api/*`
- Keep business and persistence flow in `internal/*`
- Keep reusable/shared helpers in `pkg/*`
- Avoid creating new feature-rooted package trees for backend code

### Common backend environment

- Required in most backend flows:
  - `API_CORS_ORIGIN`
  - `MONGODB_URI`
  - `MONGODB_DATABASE`
  - `SITE_URL`
  - `GMAIL_SMTP_USER`
  - `GMAIL_SMTP_APP_PASSWORD`
  - `CRON_SECRET`
- Optional:
  - `GMAIL_FROM_EMAIL`
  - `GMAIL_FROM_NAME`
  - `GMAIL_SMTP_HOST`
  - `GMAIL_SMTP_PORT`
  - `NEWSLETTER_UNSUBSCRIBE_SECRET`
  - `NEWSLETTER_MAX_RECIPIENTS_PER_RUN`
  - `NEWSLETTER_MAX_ITEM_AGE_HOURS`
  - `NEWSLETTER_UNSUBSCRIBE_TOKEN_TTL_HOURS`

## Code Style & Quality Gates

- Lint with ESLint:
  - `pnpm run lint`
  - `pnpm run lint:fix`
- Lint Go with golangci-lint:
  - `pnpm run backend:lint`
  - `pnpm run backend:lint:checkstyle`
  - config file: `.golangci.yml`
  - version is pinned in `package.json`
- Format with Prettier:
  - `pnpm run prettier:format`
  - `pnpm run prettier:check`
- EditorConfig:
  - LF
  - no trailing whitespace
  - indent size `2`

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
  - `coverage/golangci-lint-report.xml`
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

- Static frontend is served from `build/`
- Docker Compose deployment:
  - `deploy/docker-compose/docker-compose.yml`
- Helm deployment:
  - `deploy/helm/blog`
- Docker image repository defaults to `suayb/blog:main`
- Helm chart supports base path and ingress configuration through `deploy/helm/blog/values.yaml`

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

## Review Process & What Reviewers Look For

### General

- `pnpm run lint` passes
- `pnpm test` passes when frontend code changes
- `pnpm run backend:test` passes when backend code changes
- `pnpm build` passes when export behavior may change
- Sonar-sensitive changes keep quality and coverage within target

### Frontend review

- Next.js static export constraints are respected
- TypeScript remains strict
- i18n changes are made in both locales
- Markdown/content changes update the related JSON indexes

### Backend review

- GraphQL schema/resolvers stay coherent
- Newsletter flows remain explicit and test-covered
- Mongo and SMTP config handling stays observable
- New backend logic gets `*_test.go` coverage

## Common Mistakes to Avoid

- Editing generated folders instead of source files
- Updating only one locale file
- Adding a post/topic without updating indexes
- Forgetting that frontend is static-exported
- Forgetting dev rewrites depend on `NEXT_PUBLIC_DEV_API_ORIGIN`
- Running Sonar without generating `coverage/go-cover.out`
- Assuming GraphQL packages are automatically covered if they are not included in the Go coverage command
