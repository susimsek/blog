// scripts/sync-post-metadata.js
// Syncs post metadata fields (readingTimeMin, searchText) in public/data/posts.<locale>.json
// by computing from content/posts/<locale>/<id>.md.

const fs = require('node:fs');
const path = require('node:path');
const matter = require('gray-matter');

const { locales } = require('../i18n.config.json');

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

const normalizeSearchText = value => {
  const lowered = value.toLocaleLowerCase('tr');
  const dotlessNormalized = lowered.replaceAll('ı', 'i');
  const withoutMarks = dotlessNormalized.normalize('NFKD').replaceAll(/\p{M}+/gu, '');
  return withoutMarks
    .replaceAll(/[^\p{L}\p{N}]+/gu, ' ')
    .trim()
    .replaceAll(/\s+/g, ' ');
};

const buildPostSearchText = post => {
  const topics = Array.isArray(post.topics)
    ? post.topics.flatMap(topic =>
        topic && typeof topic === 'object'
          ? [topic.id, topic.name].filter(value => typeof value === 'string' && value.length > 0)
          : [],
      )
    : [];

  const parts = [post.id, post.title, post.summary, ...topics];
  return normalizeSearchText(parts.join(' '));
};

const readMarkdownContent = (id, locale) => {
  const localizedPath = path.join(postsMarkdownDirectory, locale, `${id}.md`);
  if (!fs.existsSync(localizedPath)) {
    return null;
  }

  const raw = fs.readFileSync(localizedPath, 'utf8');
  const { content } = matter(raw);
  return content;
};

const syncLocale = locale => {
  const postsPath = path.join(postsIndexDirectory, `posts.${locale}.json`);
  if (!fs.existsSync(postsPath)) {
    console.warn(`[sync-post-metadata] posts index not found for locale "${locale}": ${postsPath}`);
    return;
  }

  let posts;
  try {
    posts = JSON.parse(fs.readFileSync(postsPath, 'utf8'));
  } catch (error) {
    console.error(`[sync-post-metadata] failed to parse ${postsPath}:`, error);
    return;
  }

  if (!Array.isArray(posts)) {
    console.error(`[sync-post-metadata] expected array in ${postsPath}, got: ${typeof posts}`);
    return;
  }

  const invalidCount = posts.filter(post => {
    if (!post || typeof post !== 'object') {
      return true;
    }

    if (typeof post.id !== 'string' || post.id.trim().length === 0) {
      return true;
    }

    if (typeof post.title !== 'string' || typeof post.summary !== 'string') {
      return true;
    }

    if (post.topics !== undefined && !Array.isArray(post.topics)) {
      return true;
    }

    return false;
  }).length;

  if (invalidCount > 0) {
    console.error(
      `[sync-post-metadata] locale=${locale} invalidPosts=${invalidCount}; aborting write for ${postsPath}`,
    );
    process.exitCode = 1;
    return;
  }

  let changed = 0;
  let missingMarkdown = 0;
  const next = posts.map(post => {
    const markdown = readMarkdownContent(post.id, locale);
    if (markdown === null) {
      missingMarkdown += 1;
      return post;
    }

    const readingTimeMin = calculateReadingTimeMin(markdown);
    const nextSearchText = buildPostSearchText(post);

    if (
      post.readingTimeMin !== readingTimeMin ||
      post.searchText !== nextSearchText ||
      Object.prototype.hasOwnProperty.call(post, 'readingTime')
    ) {
      changed += 1;
    }

    const { readingTime, ...rest } = post;
    void readingTime;

    return {
      ...rest,
      readingTimeMin,
      searchText: nextSearchText,
    };
  });

  if (missingMarkdown > 0) {
    console.error(
      `[sync-post-metadata] locale=${locale} missingMarkdown=${missingMarkdown}; aborting write for ${postsPath}`,
    );
    process.exitCode = 1;
    return;
  }

  fs.writeFileSync(postsPath, JSON.stringify(next, null, 2) + '\n', 'utf8');
  console.log(`[sync-post-metadata] locale=${locale} changed=${changed} -> ${postsPath}`);
};

locales.forEach(syncLocale);
