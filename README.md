# Blog Platform (Next.js 16 + Go)

[![CircleCI](https://dl.circleci.com/status-badge/img/gh/susimsek/blog/tree/main.svg?style=svg)](https://dl.circleci.com/status-badge/redirect/gh/susimsek/blog/tree/main)
[![Quality Gate Status](https://sonarcloud.io/api/project_badges/measure?project=blog&metric=alert_status)](https://sonarcloud.io/summary/overall?id=blog&branch=main)
[![Coverage](https://sonarcloud.io/api/project_badges/measure?project=blog&metric=coverage)](https://sonarcloud.io/summary/overall?id=blog&branch=main)
[![Go](https://img.shields.io/badge/Go-1.24-00ADD8?logo=go)](https://go.dev/)
[![Next.js](https://img.shields.io/badge/Next.js-16-black?logo=nextdotjs&logoColor=white)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=black)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)

This repository is a multilingual blog platform with a static-exported Next.js frontend and a Go backend for GraphQL, GraphiQL, and newsletter flows.

## Table of Contents

- [Features](#features)
- [Requirements](#requirements)
- [Tech Stack](#tech-stack)
- [Project Layout](#project-layout)
- [Local Development](#local-development)
- [Backend API Endpoints](#backend-api-endpoints)
- [Environment Variables](#environment-variables)
- [Quality and Testing](#quality-and-testing)
- [Build and Deployment](#build-and-deployment)
- [Notes](#notes)

## Features

- Static-export frontend (`next export` style output to `build/`)
- GraphQL API for posts, likes/hits, and newsletter subscription flows
- GraphiQL playground support (`/graphiql`)
- Newsletter confirmation, unsubscribe, and dispatch flows
- i18n support for English and Turkish (`en`, `tr`)
- Markdown-based content + generated post/topic/category indexes

## Requirements

- Node.js: `>= 24.13.0`
- pnpm (recommended via Corepack)
- Go: `1.24.x`
- Optional: Docker / Helm for deployment

## Tech Stack

- Frontend: Next.js 16, React 19, TypeScript, Redux Toolkit, i18next, Sass, Bootstrap
- Backend: Go 1.24, gqlgen, MongoDB driver, `net/http`
- Tooling: ESLint, Prettier, Jest + Testing Library, SonarCloud, golangci-lint

## Project Layout

### Frontend

- `src/app`: App Router routes and layouts
- `src/views`: route-level page views
- `src/components`: shared UI and game components
- `src/lib`: frontend helpers, markdown/content utilities, metadata helpers
- `src/i18n`: locale runtime and translation loading
- `public/locales`: translation namespaces

### Backend

- `api/graphql/index.go`: GraphQL + GraphiQL HTTP handler
- `api/newsletter-dispatch/index.go`: newsletter dispatch endpoint
- `internal/config`: backend-only env/config resolution
- `internal/domain`: domain entities and shared records
- `internal/graphql`: schema, generated execution code, resolvers, mapping helpers
- `internal/service`: business service orchestration
- `internal/repository`: Mongo-backed repository implementations
- `pkg/graphql`: GraphiQL page handler
- `pkg/newsletter`: mail templates, unsubscribe token/status, dispatch helpers
- `pkg/apperrors`: normalized backend error types
- `pkg/httpapi`: JSON error response helpers
- `cmd/app/main.go`: local backend entrypoint

Preferred backend layering:

- `api/*`: transport and HTTP entrypoints
- `internal/*`: private config, domain, service, repository, GraphQL internals
- `pkg/*`: reusable shared packages and helpers

Do not introduce new feature-first Go package trees.

### Content and Data

- `content/posts/en/*.md`
- `content/posts/tr/*.md`
- `public/data/posts.<locale>.json`
- `public/data/topics.<locale>.json`
- `public/data/categories.<locale>.json`
- `content/external/medium-feed.json`

## Local Development

Install dependencies:

```bash
corepack enable
pnpm install --frozen-lockfile
```

Start frontend only:

```bash
pnpm dev
```

Start backend + frontend:

```bash
# terminal 1
pnpm run backend:dev

# terminal 2
pnpm dev
```

Backend local runner (`cmd/app/main.go`) also loads `.env.local` automatically when present.

Local endpoints:

- App: `http://localhost:3000`
- Admin panel: `http://localhost:3000/admin`
- GraphQL: `http://localhost:8080/graphql`
- GraphQL alias: `http://localhost:8080/api/graphql`
- Admin GraphQL: `http://localhost:8080/api/admin/graphql`
- Reader auth session: `http://localhost:8080/api/reader-auth/session`
- Reader auth logout: `http://localhost:8080/api/reader-auth/logout`
- GraphiQL: `http://localhost:8080/graphiql`
- Newsletter dispatch: `http://localhost:8080/api/newsletter-dispatch`
- Health: `http://localhost:8080/health`

In development, `next.config.ts` rewrites `/graphql` and `/api/:path*` to the Go backend (`NEXT_PUBLIC_DEV_API_ORIGIN`, default `http://localhost:8080`).

## Backend API Endpoints

Routes registered by `cmd/app/main.go`:

### Public and Reader

| Method             | Path                       | Purpose                            |
| ------------------ | -------------------------- | ---------------------------------- |
| `GET/POST/OPTIONS` | `/graphql`                 | Public GraphQL endpoint.           |
| `GET/POST/OPTIONS` | `/api/graphql`             | Alias for public GraphQL endpoint. |
| `GET`              | `/api/github/connect`      | Reader GitHub OAuth start.         |
| `GET`              | `/api/github/callback`     | Reader GitHub OAuth callback.      |
| `GET`              | `/api/google/connect`      | Reader Google OAuth start.         |
| `GET`              | `/api/google/callback`     | Reader Google OAuth callback.      |
| `GET`              | `/api/reader-auth/session` | Reader session check.              |
| `POST`             | `/api/reader-auth/logout`  | Reader logout.                     |

### Admin

| Method             | Path                              | Purpose                          |
| ------------------ | --------------------------------- | -------------------------------- |
| `GET/POST/OPTIONS` | `/api/admin/graphql`              | Admin GraphQL endpoint.          |
| `GET/HEAD/OPTIONS` | `/api/admin-avatar`               | Admin avatar fetch endpoint.     |
| `GET`              | `/api/admin-email-change/confirm` | Admin email change confirmation. |

### Shared and System

| Method | Path                       | Purpose                        |
| ------ | -------------------------- | ------------------------------ |
| `GET`  | `/graphiql`                | GraphiQL IDE (toggle via env). |
| `GET`  | `/api/newsletter-dispatch` | Newsletter dispatch endpoint.  |
| `GET`  | `/health`                  | Health check (`ok`).           |

Note: exact allowed HTTP methods are enforced in each handler; the table reflects intended usage in current code.

## Environment Variables

### Frontend

| Variable                     | Required | Default                   | Notes                                                           |
| ---------------------------- | -------- | ------------------------- | --------------------------------------------------------------- |
| `NEXT_PUBLIC_BASE_PATH`      | No       | `""`                      | App base path (used in runtime + sitemap/rss/robots scripts).   |
| `NEXT_PUBLIC_ASSET_PREFIX`   | No       | `""`                      | Static asset prefix for Next.js export.                         |
| `NEXT_PUBLIC_GA_ID`          | No       | `""`                      | Google Analytics ID.                                            |
| `NEXT_PUBLIC_SITE_URL`       | No       | `https://suaybsimsek.com` | Public site URL used by frontend helpers.                       |
| `NEXT_PUBLIC_DEV_API_ORIGIN` | No       | `http://localhost:8080`   | Dev rewrite target for `/graphql` and `/api/*`.                 |
| `NEXT_PUBLIC_API_BASE_URL`   | No       | auto                      | Optional explicit API base URL for GraphQL/comment auth client. |

### Shared

| Variable   | Required                       | Default | Notes                                                     |
| ---------- | ------------------------------ | ------- | --------------------------------------------------------- |
| `SITE_URL` | Yes (backend/newsletter flows) | -       | Required by newsletter/auth flows; should be full origin. |

### Backend and Newsletter

| Variable                                 | Required                          | Default                    | Notes                                      |
| ---------------------------------------- | --------------------------------- | -------------------------- | ------------------------------------------ |
| `API_CORS_ORIGIN`                        | Yes (in production backend flows) | `""`                       | Allowed CORS origin for API responses.     |
| `MONGODB_URI`                            | Yes                               | -                          | MongoDB connection URI.                    |
| `MONGODB_DATABASE`                       | Yes                               | -                          | MongoDB database name.                     |
| `GMAIL_SMTP_USER`                        | Yes (mail/newsletter)             | -                          | SMTP auth username.                        |
| `GMAIL_SMTP_APP_PASSWORD`                | Yes (mail/newsletter)             | -                          | SMTP app password.                         |
| `GMAIL_FROM_EMAIL`                       | No                                | `GMAIL_SMTP_USER`          | Sender email address.                      |
| `GMAIL_FROM_NAME`                        | No                                | `Suayb's Blog`             | Sender display name.                       |
| `GMAIL_SMTP_HOST`                        | No                                | `smtp.gmail.com`           | SMTP host.                                 |
| `GMAIL_SMTP_PORT`                        | No                                | `587`                      | SMTP port.                                 |
| `NEWSLETTER_UNSUBSCRIBE_SECRET`          | Yes                               | -                          | Secret used for unsubscribe tokens.        |
| `NEWSLETTER_MAX_RECIPIENTS_PER_RUN`      | No                                | `200`                      | Newsletter dispatch batch size cap.        |
| `NEWSLETTER_MAX_ITEM_AGE_HOURS`          | No                                | `168`                      | Max age of items included in a dispatch.   |
| `NEWSLETTER_UNSUBSCRIBE_TOKEN_TTL_HOURS` | No                                | `8760`                     | Unsubscribe token TTL in hours.            |
| `CRON_SECRET`                            | Yes (dispatch endpoint)           | -                          | Protects cron-triggered dispatch endpoint. |
| `GRAPHIQL_ENABLED`                       | No                                | `false`                    | Enables `/graphiql`.                       |
| `GRAPHQL_INTROSPECTION_ENABLED`          | No                                | follows `GRAPHIQL_ENABLED` | Explicitly controls GraphQL introspection. |
| `LOCAL_GO_API_PORT`                      | No                                | `8080`                     | Local backend port.                        |

### Auth and OAuth

| Variable                      | Required    | Default                       | Notes                                               |
| ----------------------------- | ----------- | ----------------------------- | --------------------------------------------------- |
| `JWT_SECRET`                  | Conditional | `""`                          | Needed for admin/reader JWT signing in auth flows.  |
| `COOKIE_SECURE`               | No          | auto (`SITE_URL` https check) | Forces secure cookie flag when set.                 |
| `ADMIN_JWT_ISSUER`            | No          | `blog-admin`                  | Admin token issuer.                                 |
| `ADMIN_JWT_AUDIENCE`          | No          | `blog-admin`                  | Admin token audience.                               |
| `ADMIN_ACCESS_COOKIE_NAME`    | No          | `admin_access`                | Admin access cookie name.                           |
| `ADMIN_REFRESH_COOKIE_NAME`   | No          | `admin_refresh`               | Admin refresh cookie name.                          |
| `ADMIN_CSRF_COOKIE_NAME`      | No          | `admin_csrf`                  | Admin CSRF cookie name.                             |
| `ADMIN_ACCESS_TTL`            | No          | `12h`                         | Admin access token duration (`time.ParseDuration`). |
| `ADMIN_REFRESH_TTL`           | No          | `168h`                        | Admin refresh token duration.                       |
| `ADMIN_REMEMBER_REFRESH_TTL`  | No          | `720h`                        | Admin remember-me refresh duration.                 |
| `READER_JWT_ISSUER`           | No          | `blog-reader`                 | Reader token issuer.                                |
| `READER_JWT_AUDIENCE`         | No          | `blog-reader`                 | Reader token audience.                              |
| `READER_ACCESS_COOKIE_NAME`   | No          | `reader_access`               | Reader access cookie name.                          |
| `READER_REFRESH_COOKIE_NAME`  | No          | `reader_refresh`              | Reader refresh cookie name.                         |
| `READER_ACCESS_TTL`           | No          | `12h`                         | Reader access token duration.                       |
| `READER_REFRESH_TTL`          | No          | `168h`                        | Reader refresh token duration.                      |
| `READER_REMEMBER_REFRESH_TTL` | No          | `720h`                        | Reader remember-me refresh duration.                |
| `GITHUB_CLIENT_ID`            | No          | `""`                          | Enables GitHub OAuth when paired with secret.       |
| `GITHUB_CLIENT_SECRET`        | No          | `""`                          | Enables GitHub OAuth when paired with client ID.    |
| `GOOGLE_CLIENT_ID`            | No          | `""`                          | Enables Google OAuth when paired with secret.       |
| `GOOGLE_CLIENT_SECRET`        | No          | `""`                          | Enables Google OAuth when paired with client ID.    |

### Content Sync Script

| Variable                  | Required | Default        | Notes                                              |
| ------------------------- | -------- | -------------- | -------------------------------------------------- |
| `NEWSLETTER_SYNC_LOCALES` | No       | script-defined | Used by `scripts/sync-newsletter-content/main.go`. |

### SonarCloud

| Variable          | Required | Default | Notes                                                 |
| ----------------- | -------- | ------- | ----------------------------------------------------- |
| `SONAR_TOKEN`     | No       | -       | Token for SonarCloud scan auth.                       |
| `SONARQUBE_TOKEN` | No       | -       | Alternative token variable used in some environments. |

## Quality and Testing

Frontend checks:

```bash
pnpm test
pnpm run lint
pnpm run typecheck
```

Backend checks:

```bash
pnpm run backend:lint
pnpm run backend:test
pnpm run backend:ci
```

Coverage and quality reports consumed by Sonar:

- `coverage/lcov.info`
- `coverage/test-report.xml`
- `coverage/go-cover.out`
- `golangci-lint-report.xml`

## Build and Deployment

Static build:

```bash
pnpm build
```

Docker Compose:

```bash
docker-compose -f deploy/docker-compose/docker-compose.yml up -d
docker-compose -f deploy/docker-compose/docker-compose.yml down
```

Helm:

```bash
helm install blog deploy/helm/blog
helm uninstall blog
```

Deployment files:

- `deploy/docker-compose/docker-compose.yml`
- `deploy/helm/blog`

## Notes

- Frontend is static-exported; avoid server-only Next.js patterns.
- When adding UI copy, update both locale files (`en` and `tr`).
- When adding posts, keep locale markdown and JSON indexes in sync.
