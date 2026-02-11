// scripts/normalize-post-topics.js
// Normalizes topic objects inside public/data/posts.<locale>.json
// by using content/topics/<locale>/topics.json as the source of truth.

const fs = require('node:fs');
const path = require('node:path');

const locales = ['en', 'tr'];

const readJson = filePath => JSON.parse(fs.readFileSync(filePath, 'utf8'));

const writeJson = (filePath, value) => {
  fs.writeFileSync(filePath, JSON.stringify(value, null, 2) + '\n', 'utf8');
};

const normalizeLocale = locale => {
  const topicsPath = path.join(process.cwd(), 'content', 'topics', locale, 'topics.json');
  const postsPath = path.join(process.cwd(), 'public', 'data', `posts.${locale}.json`);

  const topics = readJson(topicsPath);
  const topicById = new Map(topics.map(topic => [topic.id, topic]));

  const posts = readJson(postsPath);

  let changed = 0;
  let missingTopicCount = 0;

  const normalizedPosts = posts.map(post => {
    const originalTopics = Array.isArray(post.topics) ? post.topics : [];
    if (originalTopics.length === 0) {
      return post;
    }

    let postChanged = false;
    const normalizedTopics = originalTopics
      .map(topic => {
        const canonical = topicById.get(topic.id);
        if (!canonical) {
          missingTopicCount += 1;
          return topic;
        }

        const next = {
          id: canonical.id,
          name: canonical.name,
          color: canonical.color,
          ...(topic.link ? { link: topic.link } : {}),
        };

        const isSame =
          topic.id === next.id &&
          topic.name === next.name &&
          topic.color === next.color &&
          (topic.link ?? undefined) === (next.link ?? undefined);

        if (!isSame) {
          postChanged = true;
        }

        return next;
      })
      .filter(Boolean);

    if (!postChanged) {
      return post;
    }

    changed += 1;
    return {
      ...post,
      topics: normalizedTopics,
    };
  });

  writeJson(postsPath, normalizedPosts);

  return {
    locale,
    changedPosts: changed,
    missingTopicRefs: missingTopicCount,
    postsPath,
  };
};

const results = locales.map(normalizeLocale);
for (const r of results) {
  console.log(
    `[normalize-post-topics] locale=${r.locale} changedPosts=${r.changedPosts} missingTopicRefs=${r.missingTopicRefs} -> ${r.postsPath}`,
  );
}
