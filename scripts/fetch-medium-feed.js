// scripts/fetch-medium-feed.js
const fs = require('node:fs/promises');
const path = require('node:path');
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
    await fs.mkdir(path.dirname(FEED_PATH), { recursive: true });
    await fs.writeFile(FEED_PATH, JSON.stringify(feed, null, 2), 'utf-8');
    console.log(`✅ Medium feed updated: ${FEED_PATH}`);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error('❌ Failed to fetch Medium RSS feed:', message);
  }
}

updateFeed();
