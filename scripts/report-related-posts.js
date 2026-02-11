// scripts/report-related-posts.js
// Prints a quick "related posts" preview for a locale using topic IDF scoring.

const fs = require('node:fs');
const path = require('node:path');

const locale = process.argv[2] || 'en';
const limit = Number(process.argv[3] || 3);

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
  const minScore = 0.5;
  const postTopicIds = new Set((post.topics || []).map(t => t.id).filter(Boolean));
  const scoredAll = posts
    .filter(candidate => candidate.id !== post.id)
    .map(candidate => {
      let sharedCount = 0;
      let score = 0;
      const shared = [];

      for (const topic of candidate.topics || []) {
        if (!topic?.id) continue;
        if (!postTopicIds.has(topic.id)) continue;
        sharedCount += 1;
        const w = idf(topic.id);
        score += w;
        shared.push({ id: topic.id, w });
      }

      shared.sort((a, b) => b.w - a.w);
      return { candidate, sharedCount, score, shared };
    })
    .filter(item => item.sharedCount > 0);

  scoredAll.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    if (b.sharedCount !== a.sharedCount) return b.sharedCount - a.sharedCount;
    return new Date(b.candidate.date).getTime() - new Date(a.candidate.date).getTime();
  });

  const strong = scoredAll.filter(item => item.score >= minScore);
  const selected = strong.slice(0, limit);
  if (selected.length < limit) {
    const selectedIds = new Set(selected.map(item => item.candidate.id));
    const fallback = scoredAll.filter(item => item.score > 0 && !selectedIds.has(item.candidate.id));
    selected.push(...fallback.slice(0, limit - selected.length));
  }

  return selected;
};

console.log(`[related-posts-report] locale=${locale} posts=${posts.length} limit=${limit}`);
for (const post of posts) {
  const related = getRelated(post);
  console.log(`\n- ${post.id}`);
  for (const r of related) {
    const shared = r.shared
      .slice(0, 5)
      .map(s => `${s.id}:${s.w.toFixed(2)}`)
      .join(', ');
    console.log(`  -> ${r.candidate.id} score=${r.score.toFixed(2)} shared=[${shared}]`);
  }
}
