import fs from 'node:fs/promises';
import path from 'node:path';

const ROOT = process.cwd();

const LOCALES = ['en', 'tr'];
const ALLOWED_TOPIC_COLORS = new Set([
  'primary',
  'secondary',
  'success',
  'info',
  'warning',
  'danger',
  'light',
  'dark',
  'red',
  'green',
  'blue',
  'orange',
  'yellow',
  'purple',
  'gray',
  'brown',
  'pink',
  'cyan',
]);

const ALLOWED_TAB_ICONS = new Set(['java', 'kotlin', 'go', 'maven', 'gradle', 'javascript', 'typescript']);

const ALLOWED_HEADING_EMOJIS = new Set(['🌟', '🛠️', '🧪', '▶️']);

const readJson = async filePath => {
  const raw = await fs.readFile(filePath, 'utf8');
  return JSON.parse(raw);
};

const exists = async filePath => {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
};

const isValidDate = s => typeof s === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(s) && !Number.isNaN(new Date(s).getTime());

const loadTopicsByLocale = async () => {
  const byLocale = new Map();
  for (const locale of LOCALES) {
    const p = path.join(ROOT, 'content', 'topics', locale, 'topics.json');
    const topics = await readJson(p);
    const byId = new Map(topics.map(t => [t.id, t]));
    byLocale.set(locale, { file: p, topics, byId });
  }
  return byLocale;
};

const loadPostsByLocale = async () => {
  const byLocale = new Map();
  for (const locale of LOCALES) {
    const p = path.join(ROOT, 'content', 'posts', locale, 'posts.json');
    const posts = await readJson(p);
    const byId = new Map(posts.map(post => [post.id, post]));
    byLocale.set(locale, { file: p, posts, byId });
  }
  return byLocale;
};

const fail = (errors, message) => errors.push(message);
const warn = (warnings, message) => warnings.push(message);

const main = async () => {
  const errors = [];
  const warnings = [];

  const topicsByLocale = await loadTopicsByLocale();
  const postsByLocale = await loadPostsByLocale();

  // Cross-locale ID consistency
  const enPostIds = new Set(postsByLocale.get('en')?.posts.map(p => p.id) ?? []);
  const trPostIds = new Set(postsByLocale.get('tr')?.posts.map(p => p.id) ?? []);
  for (const id of enPostIds) if (!trPostIds.has(id)) fail(errors, `Post id missing in tr posts.json: ${id}`);
  for (const id of trPostIds) if (!enPostIds.has(id)) fail(errors, `Post id missing in en posts.json: ${id}`);

  const enTopicIds = new Set(topicsByLocale.get('en')?.topics.map(t => t.id) ?? []);
  const trTopicIds = new Set(topicsByLocale.get('tr')?.topics.map(t => t.id) ?? []);
  for (const id of enTopicIds) if (!trTopicIds.has(id)) fail(errors, `Topic id missing in tr topics.json: ${id}`);
  for (const id of trTopicIds) if (!enTopicIds.has(id)) fail(errors, `Topic id missing in en topics.json: ${id}`);

  // Validate posts
  for (const locale of LOCALES) {
    const { posts, file: postsFile } = postsByLocale.get(locale);
    const { byId: topicById, file: topicsFile } = topicsByLocale.get(locale);

    const seen = new Set();
    for (const post of posts) {
      if (!post?.id || typeof post.id !== 'string') {
        fail(errors, `${postsFile}: post is missing a string id`);
        continue;
      }
      if (seen.has(post.id)) fail(errors, `${postsFile}: duplicate post id: ${post.id}`);
      seen.add(post.id);

      if (!post.title || typeof post.title !== 'string') fail(errors, `${postsFile}: ${post.id} missing title`);
      if (!post.summary || typeof post.summary !== 'string') fail(errors, `${postsFile}: ${post.id} missing summary`);
      if (!isValidDate(post.date)) fail(errors, `${postsFile}: ${post.id} invalid date: ${post.date}`);

      if (post.thumbnail == null || typeof post.thumbnail !== 'string') {
        fail(errors, `${postsFile}: ${post.id} missing thumbnail`);
      } else {
        if (!post.thumbnail.startsWith('/images/'))
          warn(warnings, `${postsFile}: ${post.id} thumbnail should start with /images/: ${post.thumbnail}`);
        if (!post.thumbnail.endsWith('.webp'))
          warn(warnings, `${postsFile}: ${post.id} thumbnail should be .webp: ${post.thumbnail}`);
        const publicPath = path.join(ROOT, 'public', post.thumbnail.replace(/^\//, ''));
        if (!(await exists(publicPath)))
          fail(errors, `${postsFile}: ${post.id} thumbnail file not found: ${publicPath}`);
      }

      const mdPath = path.join(ROOT, 'content', 'posts', locale, `${post.id}.md`);
      if (!(await exists(mdPath))) fail(errors, `${postsFile}: ${post.id} markdown missing: ${mdPath}`);
      if (await exists(mdPath)) {
        const md = await fs.readFile(mdPath, 'utf8');
        const iconMatches = md.matchAll(/\[icon=([^\]]+)\]/g);
        for (const match of iconMatches) {
          const icon = match[1];
          if (!ALLOWED_TAB_ICONS.has(icon)) {
            warn(warnings, `${mdPath}: unknown tab icon "${icon}" (allowed: ${[...ALLOWED_TAB_ICONS].join(', ')})`);
          }
        }

        const headingLines = md.split(/\r?\n/).filter(line => /^#{2,6}\s+/.test(line));
        for (const line of headingLines) {
          const m =
            /^#{2,6}\s+(?<emoji>[\p{Extended_Pictographic}\p{Emoji_Presentation}][\p{Extended_Pictographic}\p{Emoji_Presentation}\uFE0F\u200D]*)\s+/u.exec(
              line,
            );
          if (m?.groups?.emoji && !ALLOWED_HEADING_EMOJIS.has(m.groups.emoji)) {
            warn(warnings, `${mdPath}: non-standard heading emoji "${m.groups.emoji}" -> ${line.trim()}`);
          }

          const isStepLike = /\b(Step|Adım)\s+\d+:/u.test(line);
          if (isStepLike && !/^##\s+(🛠️|🧪|▶️)\s+(Step|Adım)\s+\d+:/u.test(line)) {
            warn(warnings, `${mdPath}: non-standard step heading format -> ${line.trim()}`);
          }
        }
      }

      if (post.topics != null && !Array.isArray(post.topics)) {
        fail(errors, `${postsFile}: ${post.id} topics must be an array`);
      }

      for (const topic of post.topics ?? []) {
        if (!topic?.id || typeof topic.id !== 'string') {
          fail(errors, `${postsFile}: ${post.id} has a topic without id`);
          continue;
        }
        const canonical = topicById.get(topic.id);
        if (!canonical) {
          fail(errors, `${postsFile}: ${post.id} topic id not in ${topicsFile}: ${topic.id}`);
          continue;
        }

        if (!ALLOWED_TOPIC_COLORS.has(topic.color)) {
          fail(errors, `${postsFile}: ${post.id} topic ${topic.id} has invalid color: ${topic.color}`);
        }

        if (topic.name && canonical.name && topic.name !== canonical.name) {
          warn(
            warnings,
            `${postsFile}: ${post.id} topic name differs for ${topic.id} ("${topic.name}" vs "${canonical.name}")`,
          );
        }
        if (topic.color && canonical.color && topic.color !== canonical.color) {
          warn(
            warnings,
            `${postsFile}: ${post.id} topic color differs for ${topic.id} ("${topic.color}" vs "${canonical.color}")`,
          );
        }
      }
    }
  }

  if (warnings.length) {
    console.warn(`Warnings (${warnings.length}):`);
    for (const w of warnings) console.warn(`- ${w}`);
  }

  if (errors.length) {
    console.error(`Errors (${errors.length}):`);
    for (const e of errors) console.error(`- ${e}`);
    process.exit(1);
  }

  console.log('OK: content checks passed');
};

main().catch(err => {
  console.error(err);
  process.exit(1);
});
