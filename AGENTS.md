# AI Agent Guidelines

This repo is a blog application built with **Next.js (static export)**. It reads content from Markdown and supports **multiple languages (en/tr)**.
Tech stack: Next.js 16, React 19, TypeScript, Redux Toolkit, i18next + react-i18next, Bootstrap/Sass, ESLint (flat config), Jest + Testing Library.

## Table of Contents

1. [Agent MCP Usage Guidelines](#agent-mcp-usage-guidelines)
2. [Quick Reference](#quick-reference)
3. [Prerequisites](#prerequisites)
4. [Project Structure](#project-structure)
5. [Static Export](#static-export)
6. [Internationalization](#internationalization)
7. [SEO](#seo)
8. [TypeScript](#typescript)
9. [Code Style & Quality Gates](#code-style--quality-gates)
10. [Testing Guidelines](#testing-guidelines)
11. [Deployment](#deployment)
12. [Pull Request & Commit Guidelines](#pull-request--commit-guidelines)
13. [Review Process & What Reviewers Look For](#review-process--what-reviewers-look-for)
14. [Common Mistakes to Avoid](#common-mistakes-to-avoid)

## Agent MCP Usage Guidelines

- Always use the Context7 MCP server when you need library/API documentation (e.g., Next.js, React, TypeScript, Redux Toolkit, i18next/react-i18next, Jest, Testing Library, Bootstrap/Sass), code generation, setup or configuration steps without me having to explicitly ask.

## Quick Reference

| Action                 | Command                                                            |
| ---------------------- | ------------------------------------------------------------------ |
| Install                | `pnpm install --frozen-lockfile`                                   |
| Dev                    | `pnpm dev`                                                         |
| Build (prod export)    | `pnpm build`                                                       |
| Preview (static)       | `pnpm build` then `pnpm dlx serve build`                           |
| Unit tests             | `pnpm test`                                                        |
| Single test file       | `pnpm test -- __tests__/lib/posts.test.tsx`                        |
| Lint                   | `pnpm run lint`                                                    |
| Lint fix               | `pnpm run lint:fix`                                                |
| Format                 | `pnpm run prettier:format`                                         |
| Format check           | `pnpm run prettier:check`                                          |
| Typecheck              | `pnpm run typecheck`                                               |
| I18n types (interface) | `pnpm run i18n:interface`                                          |
| Sonar (local)          | `pnpm run sonar`                                                   |
| Update Medium feed     | `pnpm run fetch:medium`                                            |
| Docker Compose deploy  | `docker-compose -f deploy/docker-compose/docker-compose.yml up -d` |
| Helm deploy            | `helm install blog deploy/helm/blog`                               |

## Prerequisites

- Node.js: `>= 24.13.0` (see `package.json#engines`)
- Package manager: `pnpm` (lockfile: `pnpm-lock.yaml`; use Corepack)

## Project Structure

### Frontend

- Application: `src`
  - `app`: routing (App Router)
    - `[locale]`: locale-prefixed routes (static export outputs `/en/.../index.html`, etc.)
    - top-level route shims (`about`, `contact`, `medium`, `search`, `posts/[id]`, `topics/[id]`) redirect to `/{locale}/...`
    - `layout.tsx`: root metadata and global style entry
    - `[locale]/layout.tsx`: locale providers + static params
    - `not-found.tsx` and `[locale]/not-found.tsx`: 404 surfaces
  - `views`: route-level UI (page views used by App Router)
  - `components`: shared UI components
    - `LocaleRedirect.tsx`: locale redirect helpers (used by root/shim pages)
  - `config`: app config + Redux store + validation/schema helpers
    - `store.ts`: Redux store setup
    - `constants.ts`: app constants
    - `createValidationSchema.ts`: form/validation schema helpers
    - `markdownSchema.ts`: Markdown-related schema/config
    - `iconLoader.ts`: icon loading utilities
  - `reducers`: Redux slices/reducers (`postsQuery.ts`, `theme.ts`)
  - `lib`: shared frontend code
    - `languageDetector.ts`: locale detection + cache
    - `posts.ts`: Markdown/index readers for posts
    - `postFilters.ts`: post filtering/sorting helpers
    - `markdownUtils.ts`: Markdown utilities
    - `medium.ts`: Medium feed helpers (reads `content/external/medium-feed.json`)
    - `cacheUtils.ts`: caching helpers
    - `icons/*`: icon registry/helpers
  - `hooks`: shared React hooks
  - `styles`: global Sass/CSS
  - `types`: shared TypeScript types and declarations
- Public assets: `public`
  - `locales/<lng>/<ns>.json`: i18n translation files
- Tests: `__tests__` (Jest + Testing Library)
- Frontend config:
  - `next.config.ts`: Next config (static export: `output: 'export'`, output dir: `build/`)
  - `i18n.config.json`: locale source-of-truth for app/runtime scripts

### Content

- Posts:
  - Markdown: `content/posts/<locale>/*.md`
  - Index: `public/data/posts.<locale>.json`
- Topics index: `public/data/topics.<locale>.json`
- Medium cache: `content/external/medium-feed.json` (generated by `pnpm run fetch:medium`)

### Build & Deploy

- Build output: `build/` (generated; served by NGINX in deploy)
- NGINX template: `nginx/nginx.conf.template`
- Docker image: `Dockerfile`
- Docker Compose: `deploy/docker-compose/docker-compose.yml`
- Helm chart: `deploy/helm/blog`

## Static Export

- `next.config.ts`:
  - `output: 'export'` → static export; avoid server-only runtime patterns.
  - `distDir: 'build'` → build/export output lives under `build/`.
  - `basePath` and `assetPrefix` are controlled via environment.
  - `images.unoptimized: true` → use static images; avoid relying on Next image optimization.
  - `turbopack.rules['*.svg']` → SVG imports are handled via `@svgr/webpack` (Turbopack).
- Static export constraints:
  - Avoid `getServerSideProps`, API routes, and other server-runtime-only features.
  - Keep code browser-safe: don’t access `window`/`document` at module scope unless guarded.
- Environment variables:
  - `NEXT_PUBLIC_BASE_PATH`: subpath deploy (e.g. `/blog`)
  - `NEXT_PUBLIC_ASSET_PREFIX`: CDN/prefix (e.g. `https://cdn...`)
  - `NEXT_PUBLIC_GA_ID`: Google Analytics id
  - `SITE_URL`: base URL for sitemap/rss generation and SEO

## Internationalization

- When adding a new post:
  - Markdown file: `content/posts/<locale>/<slug>.md`
  - Frontmatter fields: `title`, `date`, `summary`, `thumbnail`, `readingTime`, `topics[]`
  - Update the index: `public/data/posts.<locale>.json` (lists are read from this file)
- When adding a new topic, update `public/data/topics.<locale>.json`.
- When adding new UI copy:
  - Update both locale namespaces: `public/locales/en/*.json` and `public/locales/tr/*.json`
  - Ensure route metadata/translator usage includes needed namespaces (see `src/i18n/server.ts` and route `generateMetadata` files).

## TypeScript

- Typecheck: `pnpm run typecheck`
- Use `strict` TypeScript settings; avoid `any` in new code unless required.
- Keep `src/types/` for shared type declarations and generated type outputs.
- Generate i18n types after updating locale JSON: `pnpm run i18n:interface`

## Code Style & Quality Gates

- Lint: ESLint (flat config; see `eslint.config.mjs`). Note: Next.js 16 removed `next lint`, so linting is done via `eslint`.
  - Check: `pnpm run lint`
  - Fix: `pnpm run lint:fix`
- Format: Prettier (see `.prettierrc.json`)
  - Apply: `pnpm run prettier:format`
- EditorConfig: `.editorconfig` (LF, no trailing whitespace, indent=2)
- Import/alias:
  - `@/*` → `src/*`
  - `@assets/*` → `src/assets/*`
  - `@components/*` → `src/components/*`
  - `@config/*` → `src/config/*`
  - `@hooks/*` → `src/hooks/*`
  - `@lib/*` → `src/lib/*`
  - `@pages/*` → `src/pages/*`
  - `@reducers/*` → `src/reducers/*`
  - `@styles/*` → `src/styles/*`
  - `@types/*` → `src/types/*`
  - `@views/*` → `src/views/*`
  - `@tests/*` → `__tests__/*`
  - `@root/*` → repo root (`./*`)

## Testing Guidelines

- Jest + Testing Library: tests live under `__tests__/`.
- Recommended pattern:
  - For components that need Redux, use `__tests__/utils/renderWithProviders.tsx`.
- Coverage output: `coverage/` (reporter: `jest-sonar` writes `coverage/test-report.xml`)

## Deployment

- The Docker image serves the static `build/` output with NGINX (health endpoint: `/health`).
- `deploy/docker-compose/docker-compose.yml` runs the `suayb/blog:main` image as a single service.
- The Helm chart supports subpath/host-based deploys via `app.basePath` and ingress settings (see `deploy/helm/blog/values.yaml`).

## Pull Request & Commit Guidelines

### General

- Keep changes focused; avoid drive-by refactors in the same PR.
- Prefer small, logically grouped commits; avoid `WIP` / “fix typo” noise.
- Never include secrets (e.g., API keys, tokens) in commits/PRs; prefer env vars and document required setup in `README.md`.
- Never commit generated output (`build/`, `.next/`) or local artifacts (`coverage/`, `node_modules/`).

### Conventional Commits

- Use **Conventional Commits**:
  - `feat`: new feature
  - `fix`: bug fix
  - `docs`: documentation only
  - `test`: adding or fixing tests
  - `chore`: tooling/build changes
  - `perf`: performance improvement
  - `refactor`: code changes without feature or fix
  - `build`: changes that affect build/export/deploy artifacts
  - `ci`: CI configuration
  - `style`: formatting-only changes
  - `types`: type-only changes
  - `revert`: reverts a previous commit

### Commit Message Format

```
<type>(<scope>): <short summary>

Optional longer description.
```

- Keep summary under 80 characters. Use imperative present tense.
- Suggested scopes: `content`, `i18n`, `seo`, `ui`, `routing`, `redux`, `build`, `deploy`.

### Before Opening a PR

- Always apply formatting and run at least unit checks:
  - Format: `pnpm run prettier:format`
  - Lint: `pnpm run lint`
  - Unit tests: `pnpm test`
- When output/export behavior can change, also run:
  - Production build + export hooks: `pnpm build` (runs `postbuild` sitemap/RSS generation)
- Note: pre-commit runs `lint-staged` (ESLint `--fix` + Prettier) via Husky, but still run the commands above before opening a PR.

### PR Title & Description

- PR title: use a Conventional Commit-style title (same as commit summary).
- PR description should include:
  - What changed and why
  - How to verify (exact commands and/or steps)
  - Any risks, rollback notes, or follow-ups

### Call Out Cross-Cutting Impacts

- Content/index changes:
  - New/updated posts: `content/posts/<locale>/*.md` and `public/data/posts.<locale>.json`
  - New/updated topics: `public/data/topics.<locale>.json`
- i18n changes: `public/locales/en/*.json` and `public/locales/tr/*.json`
- SEO/feeds:
  - Sitemap/RSS output changes (verify `SITE_URL` assumptions)
  - `scripts/generate-sitemap.js` / `scripts/generate-rss.js` changes
- Export/deploy routing:
  - `NEXT_PUBLIC_BASE_PATH` / `NEXT_PUBLIC_ASSET_PREFIX` behavior changes
  - NGINX routing changes: `nginx/nginx.conf.template`
  - Docker/Helm changes under `deploy/`

## Review Process & What Reviewers Look For

### General (Applies to All PRs)

- ✅ Automated checks pass (`pnpm run lint`, `pnpm test`; and `pnpm build` when relevant).
- ✅ Changes are focused and minimal; no unrelated refactors or drive-by cleanups.
- ✅ Commit history is clean, logical, and follows Conventional Commits.
- ✅ No secrets, credentials, or environment-specific values are committed.
- ✅ PR description clearly explains:
  - What changed and why
  - How to verify
  - Risks or follow-ups (if any)

### Frontend Review Checklist

- ✅ Next.js static export constraints are respected (`output: 'export'`): no server-only patterns added.
- ✅ Build, lint, and tests pass when UI/logic is touched (`pnpm build`, `pnpm run lint`, `pnpm test`).
- ✅ UI/UX changes include brief notes or screenshots when behavior/visuals change.
- ✅ TypeScript stays strict and consistent (avoid `any`, keep props types readonly where applicable).
- ✅ No unsafe rendering patterns are introduced (avoid `dangerouslySetInnerHTML`; keep Markdown sanitization in place).

### Content & i18n Review Checklist

- ✅ New/edited post/topic updates include the corresponding JSON index updates.
- ✅ i18n keys are added/updated in both locales (en/tr) and namespaces remain consistent.
- ✅ URLs and metadata are consistent across locales (titles, summaries, topics).
- ✅ SEO artifacts remain correct after build (`build/` includes updated sitemap/RSS when `pnpm build` is run).

## Common Mistakes to Avoid

- Editing generated folders (`build/`, `.next/`) instead of source code.
- Adding a new post/topic but forgetting to update the post/topic indexes (`public/data/posts.<locale>.json` and `public/data/topics.<locale>.json`).
- Adding an i18n key but updating only one locale file.
- Introducing server-only APIs or runtime dependencies in an `output: 'export'` environment.
- Using `NEXT_PUBLIC_BASE_PATH` without accounting for asset paths and NGINX 404 routing.
- If Sass deprecation warnings appear in CI: prefer `@use` over `@import`, and keep `next.config.ts` `sassOptions.quietDeps` enabled to silence dependency noise.
- Ignoring large-page-data warnings: large static payloads from locale/post preloads can impact performance.
