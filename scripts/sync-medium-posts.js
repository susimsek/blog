// scripts/sync-medium-posts.js
// Syncs Medium RSS entries into public/data/posts.<locale>.json as source="medium" records.

const fs = require('node:fs');
const path = require('node:path');

const { locales } = require('../i18n.config.json');

const FEED_PATH = path.join(process.cwd(), 'content', 'external', 'medium-feed.json');
const POSTS_DIR = path.join(process.cwd(), 'public', 'data');

const TOPIC_COLORS = ['red', 'green', 'blue', 'orange', 'yellow', 'purple', 'gray', 'brown', 'pink', 'cyan'];

const WHITESPACE_CHARS = new Set([' ', '\n', '\r', '\t', '\f', '\v']);

const collapseWhitespace = value => {
  let result = '';
  let inWhitespace = false;

  for (const char of value) {
    if (WHITESPACE_CHARS.has(char)) {
      if (!inWhitespace) {
        result += ' ';
        inWhitespace = true;
      }
    } else {
      inWhitespace = false;
      result += char;
    }
  }

  return result.trim();
};

const stripHtml = html => {
  let result = '';
  let insideTag = false;

  for (const char of html) {
    if (char === '<') {
      insideTag = true;
      continue;
    }

    if (char === '>') {
      insideTag = false;
      result += ' ';
      continue;
    }

    if (!insideTag) {
      result += char;
    }
  }

  return collapseWhitespace(result);
};

const extractAttributeValue = (tag, attribute) => {
  const lowerTag = tag.toLowerCase();
  const attributePattern = `${attribute.toLowerCase()}=`;
  const attrIndex = lowerTag.indexOf(attributePattern);

  if (attrIndex === -1) {
    return null;
  }

  let valueStart = attrIndex + attributePattern.length;
  const quoteChar = tag[valueStart];
  let valueEnd;

  if (quoteChar === '"' || quoteChar === "'") {
    valueStart += 1;
    valueEnd = tag.indexOf(quoteChar, valueStart);
    if (valueEnd === -1) {
      return null;
    }
    return tag.slice(valueStart, valueEnd);
  }

  valueEnd = valueStart;
  while (valueEnd < tag.length && !WHITESPACE_CHARS.has(tag[valueEnd]) && tag[valueEnd] !== '>') {
    valueEnd += 1;
  }

  return tag.slice(valueStart, valueEnd);
};

const extractFirstImage = html => {
  const lowerHtml = html.toLowerCase();
  let searchIndex = 0;

  while (searchIndex < lowerHtml.length) {
    const imgIndex = lowerHtml.indexOf('<img', searchIndex);
    if (imgIndex === -1) {
      return null;
    }

    const tagEnd = lowerHtml.indexOf('>', imgIndex);
    if (tagEnd === -1) {
      return null;
    }

    const tag = html.slice(imgIndex, tagEnd + 1);
    const srcValue = extractAttributeValue(tag, 'src');
    if (srcValue) {
      return srcValue;
    }

    searchIndex = tagEnd + 1;
  }

  return null;
};

const getWordsFromHtml = html => stripHtml(html).split(/\s+/).filter(Boolean);

const calculateReadingTimeMin = html => {
  const wordsPerMinute = 265;
  const words = getWordsFromHtml(html);
  return Math.max(1, Math.ceil(words.length / wordsPerMinute));
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

const getColorForTopic = value => {
  let hash = 0;
  for (const char of value) {
    hash = (char.codePointAt(0) ?? 0) + ((hash << 5) - hash);
  }
  return TOPIC_COLORS[Math.abs(hash) % TOPIC_COLORS.length];
};

const buildTopic = value => {
  const topicName = typeof value === 'string' ? value.trim() : '';
  if (!topicName) {
    return null;
  }

  const topicId = normalizeSearchText(topicName).replaceAll(/\s+/g, '-');
  if (!topicId) {
    return null;
  }

  return {
    id: topicId,
    name: topicName,
    color: getColorForTopic(topicName),
    link: `https://medium.com/tag/${encodeURIComponent(topicId)}`,
  };
};

const buildPostSearchText = post => {
  const topicNames = Array.isArray(post.topics)
    ? post.topics.map(topic => (topic && typeof topic.name === 'string' ? topic.name : '')).filter(Boolean)
    : [];

  return normalizeSearchText([post.title, post.summary, ...topicNames].join(' '));
};

const parseFeedItems = feedPayload => {
  if (!feedPayload || typeof feedPayload !== 'object' || !Array.isArray(feedPayload.items)) {
    return [];
  }

  const items = feedPayload.items;
  const posts = items.flatMap((item, index) => {
    if (!item || typeof item !== 'object') {
      return [];
    }

    const content =
      typeof item['content:encoded'] === 'string'
        ? item['content:encoded']
        : typeof item.content === 'string'
          ? item.content
          : '';

    const rawSummary =
      typeof item['content:encodedSnippet'] === 'string' ? item['content:encodedSnippet'] : stripHtml(content);
    const summary = rawSummary.length > 200 ? `${rawSummary.slice(0, 200)}...` : rawSummary;

    const rawCategories = Array.isArray(item.categories) ? item.categories : [];
    const uniqueTopics = new Map();
    for (const category of rawCategories) {
      const topic = buildTopic(category);
      if (!topic || uniqueTopics.has(topic.id)) {
        continue;
      }
      uniqueTopics.set(topic.id, topic);
    }

    const idCandidate =
      typeof item.guid === 'string' && item.guid.trim().length > 0
        ? item.guid.trim()
        : typeof item.link === 'string' && item.link.trim().length > 0
          ? item.link.trim()
          : `medium-${index}`;

    const title = typeof item.title === 'string' && item.title.trim().length > 0 ? item.title.trim() : 'Untitled';
    const publishedDate =
      typeof item.pubDate === 'string' && item.pubDate.trim().length > 0
        ? item.pubDate
        : typeof item.isoDate === 'string' && item.isoDate.trim().length > 0
          ? item.isoDate
          : new Date().toISOString();

    const post = {
      id: idCandidate,
      title,
      publishedDate,
      updatedDate: publishedDate,
      summary,
      thumbnail: extractFirstImage(content),
      topics: [...uniqueTopics.values()],
      readingTimeMin: calculateReadingTimeMin(content),
      source: 'medium',
      ...(typeof item.link === 'string' && item.link.trim().length > 0 ? { link: item.link.trim() } : {}),
    };

    return [
      {
        ...post,
        searchText: buildPostSearchText(post),
      },
    ];
  });

  const deduped = new Map();
  for (const post of posts) {
    deduped.set(post.id, post);
  }

  return [...deduped.values()].sort(
    (a, b) => new Date(b.publishedDate).getTime() - new Date(a.publishedDate).getTime(),
  );
};

const readJsonArray = filePath => {
  if (!fs.existsSync(filePath)) {
    return null;
  }

  const raw = fs.readFileSync(filePath, 'utf8');
  const parsed = JSON.parse(raw);
  return Array.isArray(parsed) ? parsed : null;
};

const syncLocale = (locale, mediumPosts) => {
  const postsPath = path.join(POSTS_DIR, `posts.${locale}.json`);
  const currentPosts = readJsonArray(postsPath);

  if (!currentPosts) {
    console.warn(`[sync-medium-posts] posts index missing or invalid for locale="${locale}": ${postsPath}`);
    return;
  }

  const blogPosts = currentPosts.filter(post => (post?.source === 'medium' ? false : true));
  const mergedPosts = [...blogPosts, ...mediumPosts].sort(
    (a, b) => new Date(b.publishedDate).getTime() - new Date(a.publishedDate).getTime(),
  );

  fs.writeFileSync(postsPath, JSON.stringify(mergedPosts, null, 2) + '\n', 'utf8');
  console.log(
    `[sync-medium-posts] locale=${locale} blog=${blogPosts.length} medium=${mediumPosts.length} total=${mergedPosts.length} -> ${postsPath}`,
  );
};

const main = () => {
  if (!fs.existsSync(FEED_PATH)) {
    console.error(`[sync-medium-posts] Medium feed file not found: ${FEED_PATH}`);
    process.exitCode = 1;
    return;
  }

  let feedPayload;
  try {
    feedPayload = JSON.parse(fs.readFileSync(FEED_PATH, 'utf8'));
  } catch (error) {
    console.error('[sync-medium-posts] Failed to parse medium-feed.json:', error);
    process.exitCode = 1;
    return;
  }

  const mediumPosts = parseFeedItems(feedPayload);
  locales.forEach(locale => syncLocale(locale, mediumPosts));
};

main();
