// scripts/audit-related-posts.js
// Prints posts that end up with 0 "meaningful" related posts (score >= minScore)
// so you can decide whether to adjust topic taxonomy.

const fs = require('node:fs');
const path = require('node:path');

const locale = process.argv[2] || 'en';
const limit = Number(process.argv[3] || 3);
const minScore = Number(process.argv[4] || 0.5);

const postsPath = path.join(process.cwd(), 'public', 'data', `posts.${locale}.json`);
const posts = JSON.parse(fs.readFileSync(postsPath, 'utf8'));

const topicFrequency = new Map();
for (const post of posts) {
  for (const topic of post.topics || []) {
    if (!topic?.id) continue;
    topicFrequency.set(topic.id, (topicFrequency.get(topic.id) || 0) + 1);
  }
}

const totalPosts = posts.length;
const idf = topicId => {
  const freq = topicFrequency.get(topicId) || 0;
  return Math.log((totalPosts + 1) / (freq + 1));
};

const getRelated = post => {
  const postTopicIds = new Set((post.topics || []).map(t => t.id).filter(Boolean));
  const scored = posts
    .filter(candidate => candidate.id !== post.id)
    .map(candidate => {
      let sharedCount = 0;
      let score = 0;

      for (const topic of candidate.topics || []) {
        if (!topic?.id) continue;
        if (!postTopicIds.has(topic.id)) continue;
        sharedCount += 1;
        score += idf(topic.id);
      }

      return { candidate, sharedCount, score };
    })
    .filter(item => item.sharedCount > 0 && item.score >= minScore);

  scored.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    if (b.sharedCount !== a.sharedCount) return b.sharedCount - a.sharedCount;
    return new Date(b.candidate.publishedDate).getTime() - new Date(a.candidate.publishedDate).getTime();
  });

  return scored.slice(0, limit);
};

const noRelated = [];
for (const post of posts) {
  const related = getRelated(post);
  if (related.length === 0) {
    noRelated.push(post.id);
  }
}

console.log(`[audit-related-posts] locale=${locale} posts=${posts.length} minScore=${minScore} limit=${limit}`);
console.log(`posts_with_no_related=${noRelated.length}`);
console.log(noRelated.join('\n'));
