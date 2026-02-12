// scripts/sync-reading-time.js
// Syncs readingTimeMin in public/data/posts.<locale>.json
// by computing from content/posts/<locale>/<id>.md (fallback: default locale markdown).

const fs = require('node:fs');
const path = require('node:path');
const matter = require('gray-matter');

const { locales, defaultLocale } = require('../i18n.config.json');

const postsIndexDirectory = path.join(process.cwd(), 'public', 'data');
const postsMarkdownDirectory = path.join(process.cwd(), 'content', 'posts');

const getWordsFromMarkdown = markdown => {
  const withoutCodeBlocks = markdown
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/~~~[\s\S]*?~~~/g, ' ')
    .replace(/`[^`]*`/g, ' ')
    .replace(/!\[([^\]]*)\]\([^)]+\)/g, '$1')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/<\/?[^>]+>/g, ' ');

  const normalized = withoutCodeBlocks.replace(/[^\p{L}\p{N}]+/gu, ' ');
  const matches = normalized.match(/\p{L}[\p{L}\p{N}'’_-]*/gu);
  return matches ?? [];
};

const calculateReadingTimeMin = markdown => {
  const words = getWordsFromMarkdown(markdown);
  const wordsPerMinute = 250;
  const minutes = words.length / wordsPerMinute;
  return Math.max(3, Math.ceil(minutes));
};

const readMarkdownContent = (id, locale) => {
  const localizedPath = path.join(postsMarkdownDirectory, locale, `${id}.md`);
  const fallbackPath = path.join(postsMarkdownDirectory, defaultLocale, `${id}.md`);

  const resolvedPath = fs.existsSync(localizedPath) ? localizedPath : fs.existsSync(fallbackPath) ? fallbackPath : null;

  if (!resolvedPath) {
    return null;
  }

  const raw = fs.readFileSync(resolvedPath, 'utf8');
  const { content } = matter(raw);
  return content;
};

const syncLocale = locale => {
  const postsPath = path.join(postsIndexDirectory, `posts.${locale}.json`);
  if (!fs.existsSync(postsPath)) {
    console.warn(`[sync-reading-time] posts index not found for locale "${locale}": ${postsPath}`);
    return;
  }

  let posts;
  try {
    posts = JSON.parse(fs.readFileSync(postsPath, 'utf8'));
  } catch (error) {
    console.error(`[sync-reading-time] failed to parse ${postsPath}:`, error);
    return;
  }

  if (!Array.isArray(posts)) {
    console.error(`[sync-reading-time] expected array in ${postsPath}, got: ${typeof posts}`);
    return;
  }

  let changed = 0;
  const next = posts.map(post => {
    if (!post || typeof post !== 'object' || typeof post.id !== 'string') {
      return post;
    }

    const markdown = readMarkdownContent(post.id, locale) ?? `${post.title ?? ''} ${post.summary ?? ''}`.trim();
    const readingTimeMin = calculateReadingTimeMin(markdown);
    const nextReadingTimeMin = Number.isFinite(readingTimeMin) && readingTimeMin > 0 ? readingTimeMin : 3;

    if (post.readingTimeMin !== nextReadingTimeMin || Object.prototype.hasOwnProperty.call(post, 'readingTime')) {
      changed += 1;
    }

    const { readingTime, ...rest } = post;
    void readingTime;

    return {
      ...rest,
      readingTimeMin: nextReadingTimeMin,
    };
  });

  fs.writeFileSync(postsPath, JSON.stringify(next, null, 2) + '\n', 'utf8');
  console.log(`[sync-reading-time] locale=${locale} changed=${changed} -> ${postsPath}`);
};

locales.forEach(syncLocale);
