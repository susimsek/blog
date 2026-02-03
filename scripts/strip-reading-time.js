// scripts/strip-reading-time.js
// Removes "readingTime" from content/posts/<locale>/posts.json entries.

const fs = require('node:fs');
const path = require('node:path');

const locales = ['en', 'tr'];

const readJson = filePath => JSON.parse(fs.readFileSync(filePath, 'utf8'));

const writeJson = (filePath, value) => {
  fs.writeFileSync(filePath, JSON.stringify(value, null, 2) + '\n', 'utf8');
};

for (const locale of locales) {
  const postsPath = path.join(process.cwd(), 'content', 'posts', locale, 'posts.json');
  const posts = readJson(postsPath);

  let changed = 0;
  const next = posts.map(post => {
    if (!Object.prototype.hasOwnProperty.call(post, 'readingTime')) {
      return post;
    }
    const { readingTime: _readingTime, ...rest } = post;
    changed += 1;
    return rest;
  });

  writeJson(postsPath, next);
  console.log(`[strip-reading-time] locale=${locale} changedPosts=${changed} -> ${postsPath}`);
}
