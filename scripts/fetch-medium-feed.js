// scripts/fetch-medium-feed.js
const fs = require('fs');
const path = require('path');
const Parser = require('rss-parser');

const FEED_URL = 'https://medium.com/feed/@suaybsimsek58';
const FEED_PATH = path.join(process.cwd(), 'content', 'medium-feed.json');

const parser = new Parser({
  customFields: {
    item: ['content:encoded', 'content:encodedSnippet'],
  },
});

async function updateFeed() {
  console.log('⏳ Fetching Medium RSS feed...');
  try {
    const feed = await parser.parseURL(FEED_URL);
    fs.mkdirSync(path.dirname(FEED_PATH), { recursive: true });
    fs.writeFileSync(FEED_PATH, JSON.stringify(feed, null, 2), 'utf-8');
    console.log(`✅ Medium feed updated: ${FEED_PATH}`);
  } catch (error) {
    console.error('❌ Failed to fetch Medium RSS feed:', error?.message || error);
  }
}

updateFeed();
