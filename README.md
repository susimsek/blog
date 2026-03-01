# Blog Application

[![CircleCI](https://dl.circleci.com/status-badge/img/gh/susimsek/blog/tree/main.svg?style=svg)](https://dl.circleci.com/status-badge/redirect/gh/susimsek/blog/tree/main)
[![Quality Gate Status](https://sonarcloud.io/api/project_badges/measure?project=blog&metric=alert_status)](https://sonarcloud.io/summary/overall?id=blog&branch=main)
[![Coverage](https://sonarcloud.io/api/project_badges/measure?project=blog&metric=coverage)](https://sonarcloud.io/summary/overall?id=blog&branch=main)

This repository contains a multilingual blog platform with:

- a statically exported Next.js frontend
- a Go backend for GraphQL, GraphiQL, newsletter confirmation, and newsletter dispatch
- Markdown-based content in English and Turkish
- SonarCloud coverage and quality checks across frontend and backend scopes

Go code in this repo is expected to follow a layered package approach, not a feature-first package layout. New backend work should prefer handler/service/repository/helper boundaries under the existing `api`, `internal`, and `pkg` layers instead of introducing new feature-rooted package trees.

## Tech Stack

- Frontend: Next.js 16, React 19, TypeScript, Redux Toolkit, i18next, Sass, Bootstrap
- Backend: Go 1.24, gqlgen, net/http, MongoDB driver
- Tooling: pnpm, ESLint, Prettier, Jest, SonarCloud

## Quick Commands

```bash
corepack enable
pnpm install --frozen-lockfile
pnpm dev
pnpm run backend:start
pnpm test
pnpm run backend:test
pnpm run backend:cover
pnpm run lint
pnpm run typecheck
pnpm build
pnpm run sonar
```

Additional project commands:

```bash
pnpm run fetch:medium
pnpm run sync:medium-posts
pnpm run sync:post-metadata
pnpm run sync:code-filenames
pnpm run graphql:generate
pnpm run graphql:codegen
pnpm run backend:sync-content
```

Go coverage command used by Sonar:

```bash
pnpm run backend:cover
```

## Repository Layout

### Frontend

- [`src/app`](/Users/T097315/Documents/MyProject/blog/src/app): App Router routes and layouts
- [`src/views`](/Users/T097315/Documents/MyProject/blog/src/views): route-level page views
- [`src/components`](/Users/T097315/Documents/MyProject/blog/src/components): shared UI and game components
- [`src/lib`](/Users/T097315/Documents/MyProject/blog/src/lib): frontend helpers, Markdown/content utilities, metadata helpers
- [`src/i18n`](/Users/T097315/Documents/MyProject/blog/src/i18n): locale runtime and translation loading
- [`public/locales`](/Users/T097315/Documents/MyProject/blog/public/locales): translation namespaces

### Backend

- [`api/graphql/index.go`](/Users/T097315/Documents/MyProject/blog/api/graphql/index.go): GraphQL and GraphiQL HTTP handler
- [`api/newsletter-dispatch/index.go`](/Users/T097315/Documents/MyProject/blog/api/newsletter-dispatch/index.go): newsletter dispatch endpoint
- [`internal/service/post`](/Users/T097315/Documents/MyProject/blog/internal/service/post): post query service layer
- [`internal/service/newsletter`](/Users/T097315/Documents/MyProject/blog/internal/service/newsletter): newsletter subscribe/confirm/unsubscribe service layer
- [`internal/repository/post`](/Users/T097315/Documents/MyProject/blog/internal/repository/post): Mongo-backed post repository layer
- [`internal/repository/newsletter`](/Users/T097315/Documents/MyProject/blog/internal/repository/newsletter): Mongo-backed newsletter repository layer
- [`pkg/graphql`](/Users/T097315/Documents/MyProject/blog/pkg/graphql): GraphiQL page and GraphQL env helpers
- [`pkg/graph`](/Users/T097315/Documents/MyProject/blog/pkg/graph): gqlgen schema, resolvers, and mapping helpers
- [`pkg/newsletter`](/Users/T097315/Documents/MyProject/blog/pkg/newsletter): SMTP config, templates, unsubscribe tokens, status pages
- [`pkg/apperrors`](/Users/T097315/Documents/MyProject/blog/pkg/apperrors): normalized backend errors
- [`pkg/httpapi`](/Users/T097315/Documents/MyProject/blog/pkg/httpapi): backend JSON error helpers
- [`scripts/local-go-api/main.go`](/Users/T097315/Documents/MyProject/blog/scripts/local-go-api/main.go): local backend server entrypoint

Preferred backend layering:

- `api/*`: transport and HTTP entrypoints
- `internal/service/*`: business service orchestration
- `internal/repository/*`: persistence and repository implementations
- `pkg/*`: reusable shared packages, templates, schemas, and cross-cutting helpers

Avoid introducing new Go package trees that are organized primarily by product feature. Keep package boundaries technical and layered.

### Content and Generated Data

- [`content/posts/en`](/Users/T097315/Documents/MyProject/blog/content/posts/en)
- [`content/posts/tr`](/Users/T097315/Documents/MyProject/blog/content/posts/tr)
- [`public/data/posts.en.json`](/Users/T097315/Documents/MyProject/blog/public/data/posts.en.json)
- [`public/data/posts.tr.json`](/Users/T097315/Documents/MyProject/blog/public/data/posts.tr.json)
- [`public/data/topics.en.json`](/Users/T097315/Documents/MyProject/blog/public/data/topics.en.json)
- [`public/data/topics.tr.json`](/Users/T097315/Documents/MyProject/blog/public/data/topics.tr.json)
- [`content/external/medium-feed.json`](/Users/T097315/Documents/MyProject/blog/content/external/medium-feed.json)

## Local Development

### Frontend only

```bash
pnpm dev
```

Frontend runs at `http://localhost:3000`.

### Frontend + backend

```bash
# terminal 1
pnpm run backend:start

# terminal 2
pnpm dev
```

Useful local endpoints:

- App: `http://localhost:3000`
- GraphQL: `http://localhost:8080/graphql`
- GraphiQL: `http://localhost:8080/graphiql`
- Newsletter dispatch: `http://localhost:8080/api/newsletter-dispatch`
- Health: `http://localhost:8080/health`

In development, [`next.config.ts`](/Users/T097315/Documents/MyProject/blog/next.config.ts) rewrites `/graphql` and `/api/:path*` to the Go backend. The default target is `http://localhost:8080` and can be overridden with `NEXT_PUBLIC_DEV_API_ORIGIN`.

## Backend Endpoints

### GraphQL

Served by [`api/graphql/index.go`](/Users/T097315/Documents/MyProject/blog/api/graphql/index.go):

- `GET /graphql`
- `POST /graphql`
- `OPTIONS /graphql`

Supported flows include:

- post list and post detail queries
- post like and hit mutations
- newsletter subscribe, resend confirmation, confirm, and unsubscribe mutations

### GraphiQL

Served at `/graphiql` by the same backend handler.

Related environment variables:

- `GRAPHIQL_ENABLED`
- `GRAPHQL_INTROSPECTION_ENABLED`

### Newsletter dispatch

Served by [`api/newsletter-dispatch/index.go`](/Users/T097315/Documents/MyProject/blog/api/newsletter-dispatch/index.go):

- `GET /api/newsletter-dispatch`

This endpoint reads RSS feeds, syncs post metadata, deduplicates campaigns, and sends announcement emails to active subscribers.

## Environment Variables

### Frontend

- `NEXT_PUBLIC_BASE_PATH`
- `NEXT_PUBLIC_ASSET_PREFIX`
- `NEXT_PUBLIC_GA_ID`
- `NEXT_PUBLIC_SITE_URL`
- `NEXT_PUBLIC_DEV_API_ORIGIN`

### Shared

- `SITE_URL`

### Backend and newsletter

- `API_CORS_ORIGIN`
- `MONGODB_URI`
- `MONGODB_DATABASE`
- `GMAIL_SMTP_USER`
- `GMAIL_SMTP_APP_PASSWORD`
- `GMAIL_FROM_EMAIL`
- `GMAIL_FROM_NAME`
- `GMAIL_SMTP_HOST`
- `GMAIL_SMTP_PORT`
- `NEWSLETTER_UNSUBSCRIBE_SECRET`
- `NEWSLETTER_MAX_RECIPIENTS_PER_RUN`
- `NEWSLETTER_MAX_ITEM_AGE_HOURS`
- `NEWSLETTER_UNSUBSCRIBE_TOKEN_TTL_HOURS`
- `CRON_SECRET`
- `GRAPHIQL_ENABLED`
- `GRAPHQL_INTROSPECTION_ENABLED`
- `LOCAL_GO_API_PORT`

### SonarCloud

- `SONAR_TOKEN`
- `SONARQUBE_TOKEN`

## Testing and Quality

### Frontend

```bash
pnpm test
pnpm run lint
pnpm run typecheck
```

Jest coverage thresholds are configured in [`jest.config.js`](/Users/T097315/Documents/MyProject/blog/jest.config.js):

- statements: `95`
- functions: `95`
- lines: `95`

### Backend

```bash
pnpm run backend:test
pnpm run backend:cover
```

### SonarCloud

```bash
pnpm run sonar
```

SonarCloud consumes:

- `coverage/lcov.info`
- `coverage/test-report.xml`
- `coverage/go-cover.out`

The Sonar source scope is configured in [`sonar-project.properties`](/Users/T097315/Documents/MyProject/blog/sonar-project.properties) and currently includes both frontend code and selected backend packages.

## Build and Deployment

### Static build

```bash
pnpm build
```

Build output is written to [`build`](/Users/T097315/Documents/MyProject/blog/build). `postbuild` also generates sitemap, RSS, and robots assets.

### Docker Compose

```bash
docker-compose -f deploy/docker-compose/docker-compose.yml up -d
docker-compose -f deploy/docker-compose/docker-compose.yml down
```

### Helm

```bash
helm install blog deploy/helm/blog
helm uninstall blog
```

Deployment configuration lives under:

- [`deploy/docker-compose/docker-compose.yml`](/Users/T097315/Documents/MyProject/blog/deploy/docker-compose/docker-compose.yml)
- [`deploy/helm/blog`](/Users/T097315/Documents/MyProject/blog/deploy/helm/blog)
