---
name: blog-content-authoring
description: Create/update Markdown blog posts and topic metadata for this Next.js static-export blog (multi-language en/tr). Use when adding/editing files under content/posts/**, updating posts.json and topics.json indexes, choosing valid topic colors, and creating 1200x630 WebP thumbnails under public/images.
---

# Blog Content Authoring (en/tr)

This repo generates content via **static export**. List pages are driven by **JSON index** files, while the post detail page is driven by the **Markdown** file. Therefore, when adding a new post you must update Markdown + `posts.json` + thumbnail + (if needed) `topics.json` together.

## File/Folder Map

- Posts (Markdown): `content/posts/<locale>/<slug>.md` (`<locale>`: `en` or `tr`)
- Post list index: `content/posts/<locale>/posts.json`
- Topic list: `content/topics/<locale>/topics.json`
- Thumbnails: `public/images/*.webp` (referenced as `/images/<file>.webp` in Markdown/JSON)

## Non-Negotiable Rules (Summary)

1. **Slug/ID**: kebab-case (`my-new-post`). Use the same slug for both `en` and `tr`.
2. **`posts.json` is the source of truth**: list pages / RSS / sitemap use `posts.json`. Markdown is read for the detail page content + frontmatter metadata.
3. **Images**: keep post images under `/images/` and prefer `webp` for consistency/performance.
4. **Thumbnail**: `1200x630` (OG size), `webp`, under `public/images/` (recommended name: `<slug>-thumbnail.webp`).
5. **Topic consistency**: topic `id`s must exist in `topics.json` in both locales; `name` is translated per locale; `color` must be one of the allowed values.
6. **Icon standards**: tab icons use the `[icon=...]` format and must be from the allowed set; step headings must use the standardized emoji + label format (see below).

## Image Standards

### 1) Post thumbnail (required)

- **Purpose**: post list card + RSS/sitemap image + OG-like share image
- **Format**: `webp`
- **Dimensions**: `1200x630`
- **Location**: `public/images/`
- **Path in Markdown/posts.json**: `/images/<slug>-thumbnail.webp`

Generate:

```bash
node .codex/skills/blog-content-authoring/scripts/make-thumbnail.mjs \
  --in /path/to/source.png \
  --out public/images/<slug>-thumbnail.webp
```

### 2) Inline post images (optional)

If you add images inside the post body (Markdown/HTML):

- **Format**: prefer `webp`
- **Location**: `public/images/posts/<slug>/`
- **Reference path**: `/images/posts/<slug>/<name>.webp`

Generate (keeps aspect ratio, resizes to a max width):

```bash
node .codex/skills/blog-content-authoring/scripts/make-post-image.mjs \
  --in /path/to/source.png \
  --out public/images/posts/<slug>/<name>.webp \
  --maxWidth 1200
```

Recommended markup (for better layout stability):

```html
<figure>
  <img
    src="/images/posts/<slug>/<name>.webp"
    alt="Describe the image"
    width="1200"
    height="675"
    loading="lazy"
    decoding="async"
  />
  <figcaption>Optional caption</figcaption>
</figure>
```

Tip: use the generated file’s real `width`/`height` (the script prints it) to avoid layout shift.

## Icon & Heading Standards

### Tab icons (`:::tabs` + `@tab`)

Format:

```md
:::tabs
@tab Java [icon=java]
...
:::
```

Allowed tab icons:

- Languages: `java`, `kotlin`, `go`, `javascript`, `typescript`
- Build tools: `maven`, `gradle`

### Heading emojis (recommended)

Keep headings consistent across posts:

- **Prerequisites**
  - EN: `## 📋 Prerequisites`
  - TR: `## 📋 Gereksinimler`
- **Steps**
  - Build/implementation step:
    - EN: `## 🛠️ Step N: ...`
    - TR: `## 🛠️ Adım N: ...`
  - Testing/verification step: `## 🧪 Step N: ...` / `## 🧪 Adım N: ...`
  - Run/start step: `## ▶️ Step N: ...` / `## ▶️ Adım N: ...`

Note: Avoid “random” emojis in headings. Prefer the small set above so posts feel consistent.

## Add a New Post (Step-by-Step)

### 1) Choose the slug/ID

- Use only lowercase letters + digits + hyphens: `spring-boot-ai`
- The file name and the `posts.json` `id` must match.

### 2) Create the thumbnail (WebP, 1200x630)

This skill includes a helper script:

```bash
node .codex/skills/blog-content-authoring/scripts/make-thumbnail.mjs \
  --in /path/to/source.png \
  --out public/images/<slug>-thumbnail.webp
```

- Put the output **exactly** under `public/images/...`.
- Reference it in Markdown/`posts.json` as: `"/images/<slug>-thumbnail.webp"`.

### 3) Pick topics / add a new topic if needed

- To see existing topics:
  - `content/topics/en/topics.json`
  - `content/topics/tr/topics.json`
- If you need a new topic, follow “Add a New Topic” below, then use it in the post.

### 4) Create Markdown files (en + tr)

Create two files:

- `content/posts/en/<slug>.md`
- `content/posts/tr/<slug>.md`

Frontmatter template (example):

```md
---
title: '...'
date: 'YYYY-MM-DD'
summary: '...'
thumbnail: '/images/<slug>-thumbnail.webp'
readingTime: '3 min read' # Note: computed in the app; optional/ignored as a source of truth
topics:
  - id: 'java'
    name: 'Java'
    color: 'red'
---
```

Notes:

- `date` format: `YYYY-MM-DD` (e.g. `2026-02-03`)
- `topics` entries must be **objects** (`id/name/color`). The `id` must exist in `topics.json`.
- `readingTime` is computed automatically; you may keep it for consistency, but it is not a reliable source of truth.
- Content supports GitHub Flavored Markdown (tables/lists/code blocks).
- If you want tabbed blocks:

````md
:::tabs
@tab Maven [icon=maven]

```xml
...
```

@tab Gradle [icon=gradle]

```kts
...
```

:::
````

Constraint:

- The `@tab` title is parsed via a regex; avoid emojis/special characters. Use **letters/numbers/spaces**.

Link rule:

- Write internal links as `/posts/<id>` or `/topics/<id>`; the renderer will add the locale prefix automatically.

### 5) Update `posts.json` (en + tr)

Add the new entry (same `id`) to both files:

- `content/posts/en/posts.json`
- `content/posts/tr/posts.json`

Entry template:

```json
{
  "id": "<slug>",
  "title": "...",
  "date": "YYYY-MM-DD",
  "summary": "...",
  "thumbnail": "/images/<slug>-thumbnail.webp",
  "topics": [{ "id": "java", "name": "Java", "color": "red" }]
}
```

Notes:

- `title/summary/topic.name` must be translated per locale (`en` vs `tr`).
- `topics[].id` and `topics[].color` must remain the same across locales.
- Sorting is done at runtime by date; still, keeping JSON roughly **newest to oldest** is practical.

### 6) Quick validation

This skill includes a content check script:

```bash
node .codex/skills/blog-content-authoring/scripts/check-content.mjs
```

To see a quick inventory of images referenced by posts:

```bash
node .codex/skills/blog-content-authoring/scripts/report-images.mjs
```

To standardize existing posts (headings/steps/prerequisites), run:

```bash
node .codex/skills/blog-content-authoring/scripts/standardize-posts.mjs --dry-run
node .codex/skills/blog-content-authoring/scripts/standardize-posts.mjs
```

Then run the repo quality gates:

```bash
pnpm test
pnpm run lint
pnpm build
```

## Add a New Topic (Step-by-Step)

1. Choose a new topic `id` (kebab-case): `spring-ai`
2. Add it to both locale files:
   - `content/topics/en/topics.json`
   - `content/topics/tr/topics.json`
3. Template:

```json
{ "id": "spring-ai", "name": "Spring AI", "color": "orange" }
```

4. `color` must be one of:

`primary, secondary, success, info, warning, danger, light, dark, red, green, blue, orange, yellow, purple, gray, brown, pink, cyan`

5. Then add the same `id/name/color` to:
   - the Markdown frontmatter `topics` list
   - the `posts.json` `topics` list
     for the relevant posts.

## Common Mistakes

- Adding only the Markdown file but not updating `posts.json` (the post won’t appear in list/RSS/sitemap).
- Mismatched `id` vs filename (`posts.json id` != `<slug>.md`).
- Putting the thumbnail outside `public/images/` or referencing it with a path not starting with `/images/...`.
- Adding a topic in only one locale (topic pages/build become inconsistent).
- Using emojis/special characters in `@tab` titles (tab parsing may break).
