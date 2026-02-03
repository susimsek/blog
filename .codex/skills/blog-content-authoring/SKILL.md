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
3. **Thumbnail**: `1200x630` (OG size), `webp`, under `public/images/`.
4. **Topic consistency**: topic `id`s must exist in `topics.json` in both locales; `name` is translated per locale; `color` must be one of the allowed values.

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
