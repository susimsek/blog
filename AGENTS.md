# AI Agent Guidelines

This repo is a blog application built with **Next.js (static export)**. It reads content from Markdown and supports **multiple languages (en/tr)**.
Tech stack: Next.js 15, React 19, TypeScript, Redux Toolkit, next-i18next, Bootstrap/Sass, Jest + Testing Library.

## Agent MCP Usage Guidelines

- Use **Context7 MCP** whenever you need framework/library docs (Next.js, React, Redux, next-i18next, Jest, etc.).

## Quick Reference

| Action                | Command                                                            |
| --------------------- | ------------------------------------------------------------------ |
| Install               | `npm ci`                                                           |
| Dev                   | `npm run dev`                                                      |
| Build (prod export)   | `npm run build`                                                    |
| Start (Next server)   | `npm run start`                                                    |
| Unit tests            | `npm test`                                                         |
| Single test file      | `npm test -- __tests__/lib/posts.test.tsx`                         |
| Lint                  | `npm run lint`                                                     |
| Lint fix              | `npm run lint:fix`                                                 |
| Format                | `npm run prettier:format`                                          |
| Sonar (local)         | `npm run sonar`                                                    |
| Update Medium feed    | `npm run fetch:medium`                                             |
| Docker Compose deploy | `docker-compose -f deploy/docker-compose/docker-compose.yml up -d` |
| Helm deploy           | `helm install blog deploy/helm/blog`                               |

## Requirements

- Node.js: `>= 22.14.0` (see `package.json#engines`)
- Package manager: `npm` (lockfile: `package-lock.json`)

## Project Structure

- Routing (Pages Router): `src/pages`
  - Root redirect: `src/pages/index.tsx` → `src/lib/redirect.tsx`
  - Locale-based pages: `src/pages/[locale]/*`
  - Post detail: `src/pages/[locale]/posts/[id].tsx`
  - Topic detail: `src/pages/[locale]/topics/[id].tsx`
- UI components: `src/components/*`
- Page views: `src/views/pages/*`
- State (Redux): `src/config/store.ts`, slices: `src/reducers/*`, selectors: `src/selectors/*`
- Content (Markdown + indexes):
  - Posts: `content/posts/<locale>/*.md` and `content/posts/<locale>/posts.json`
  - Topics: `content/topics/<locale>/topics.json`
  - Medium cache: `content/medium-feed.json`
- i18n strings: `public/locales/<locale>/*.json` (next-i18next)
- Build output: `build/` (generated; served by NGINX in deploy)
- Deploy:
  - NGINX template: `nginx/nginx.conf.template`
  - Docker image: `Dockerfile`
  - Compose: `deploy/docker-compose/docker-compose.yml`
  - Helm chart: `deploy/helm/blog`

## Static Export & Config Notes

- `next.config.ts`:
  - `output: 'export'` → no server-side runtime; pages are generated via SSG/export.
  - `distDir: 'build'` → build/export output lives under `build/`.
  - `basePath` and `assetPrefix` are controlled via environment.
- Environment variables:
  - `NEXT_PUBLIC_BASE_PATH`: subpath deploy (e.g. `/blog`)
  - `NEXT_PUBLIC_ASSET_PREFIX`: CDN/prefix (e.g. `https://cdn...`)
  - `NEXT_PUBLIC_GA_ID`: Google Analytics id
  - `SITE_URL`: base URL for sitemap/rss generation and SEO

## Code Style & Quality Gates

- Lint: Next.js ESLint (see `.eslintrc.json`)
  - Check: `npm run lint`
  - Fix: `npm run lint:fix`
- Format: Prettier (see `.prettierrc.json`)
  - Apply: `npm run prettier:format`
- EditorConfig: `.editorconfig` (LF, no trailing whitespace, indent=2)
- Import/alias:
  - `@/*` → `src/*`
  - `@assets/*` → `src/assets/*`

## Content & i18n Guide

- When adding a new post:
  - Markdown file: `content/posts/<locale>/<slug>.md`
  - Frontmatter fields: `title`, `date`, `summary`, `thumbnail`, `readingTime`, `topics[]`
  - Update the index: `content/posts/<locale>/posts.json` (lists are read from this file).
- When adding a new topic, update `content/topics/<locale>/topics.json`.
- When adding new UI copy:
  - Update the namespace JSON files: `public/locales/en/*.json` and `public/locales/tr/*.json`
  - Make sure the page includes the correct namespaces in `makeStaticProps/makePostProps/...`.

## Testing Guide

- Jest + Testing Library: tests live under `__tests__/`.
- Recommended pattern:
  - For components that need Redux, use `__tests__/utils/renderWithProviders.tsx`.
- Coverage output: `coverage/` (reporter: `jest-sonar` writes `coverage/test-report.xml`)

## Deployment Guide

- The Docker image serves the static `build/` output with NGINX (health endpoint: `/health`).
- `deploy/docker-compose/docker-compose.yml` runs the `suayb/blog:main` image as a single service.
- The Helm chart supports subpath/host-based deploys via `app.basePath` and ingress settings (see `deploy/helm/blog/values.yaml`).

## Common Mistakes to Avoid

- Editing generated folders (`build/`, `.next/`) instead of source code.
- Adding a new post/topic but forgetting to update the `posts.json` / `topics.json` indexes.
- Adding an i18n key but updating only one locale file.
- Introducing server-only APIs or runtime dependencies in an `output: 'export'` environment.
- Using `NEXT_PUBLIC_BASE_PATH` without accounting for asset paths and NGINX 404 routing.
