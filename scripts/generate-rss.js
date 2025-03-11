// scripts/generate-rss.js
const fs = require('fs');
const path = require('path');

const siteUrl = 'https://suaybsimsek.com';
const locales = ['en', 'tr'];

/**
 * Reads posts for a given locale from posts.json.
 * @param {string} locale - The locale identifier (e.g., 'en' or 'tr').
 * @returns {Array} - Array of post objects.
 */
function readPosts(locale) {
  const postsJsonPath = path.join(process.cwd(), 'content', 'posts', locale, 'posts.json');
  if (fs.existsSync(postsJsonPath)) {
    try {
      return JSON.parse(fs.readFileSync(postsJsonPath, 'utf8'));
    } catch (error) {
      console.error(`Error reading/parsing posts.json for locale "${locale}":`, error);
      return [];
    }
  } else {
    console.warn(`posts.json not found for locale "${locale}" at ${postsJsonPath}`);
    return [];
  }
}

/**
 * Generates the RSS feed XML string using posts data.
 * @param {Array} posts - Array of post objects.
 * @param {string} locale - Locale to generate the feed for.
 * @returns {string} - The RSS feed XML content.
 */
function generateRSSFeedXML(posts, locale) {
  let title, description;
  if (locale === 'en') {
    title = "Welcome to Şuayb's Blog";
    description = "Latest posts from Şuayb's Blog";
  } else if (locale === 'tr') {
    title = "Şuayb'in Bloguna Hoş Geldiniz";
    description = "Şuayb'in Blogundan en son gönderiler";
  } else {
    title = 'Blog';
    description = 'Latest posts';
  }

  const alternateLocale = locale === 'en' ? 'tr' : 'en';

  let rss = `<?xml version="1.0" encoding="UTF-8"?>\n`;
  rss += `<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom" xmlns:media="http://search.yahoo.com/mrss/">\n`;
  rss += `  <channel>\n`;
  rss += `    <title>${title}</title>\n`;
  rss += `    <link>${siteUrl}/${locale}</link>\n`;
  rss += `    <description>${description}</description>\n`;
  rss += `    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>\n`;
  rss += `    <language>${locale}</language>\n`;
  rss += `    <atom:link rel="self" type="application/rss+xml" href="${siteUrl}/${locale}/rss.xml" />\n`;
  rss += `    <atom:link rel="alternate" hreflang="${alternateLocale}" type="application/rss+xml" href="${siteUrl}/${alternateLocale}/rss.xml" />\n\n`;

  posts.forEach(post => {
    const postUrl = `${siteUrl}/${locale}/posts/${post.id}`;
    const pubDate = new Date(post.date).toUTCString();
    rss += `    <item>\n`;
    rss += `      <title>${post.title}</title>\n`;
    rss += `      <link>${postUrl}</link>\n`;
    rss += `      <description><![CDATA[${post.summary}]]></description>\n`;
    rss += `      <pubDate>${pubDate}</pubDate>\n`;
    rss += `      <guid>${postUrl}</guid>\n`;
    // Add topics as categories if available
    if (post.topics && Array.isArray(post.topics)) {
      post.topics.forEach(topic => {
        rss += `      <category>${topic.name}</category>\n`;
      });
    }
    // Add thumbnail using media:thumbnail if available
    if (post.thumbnail) {
      const thumbnailUrl = post.thumbnail.startsWith('/') ? `${siteUrl}${post.thumbnail}` : post.thumbnail;
      rss += `      <media:thumbnail url="${thumbnailUrl}" />\n`;
    }
    rss += `    </item>\n\n`;
  });

  rss += `  </channel>\n`;
  rss += `</rss>\n`;
  return rss;
}

/**
 * Generates and writes the RSS feed for each locale.
 * The feed is written to public/{locale}/rss.xml.
 */
function generateRSSFeeds() {
  locales.forEach(locale => {
    const posts = readPosts(locale);
    const rssXML = generateRSSFeedXML(posts, locale);
    // Ensure the locale directory exists under public
    const localeDir = path.join(process.cwd(), 'public', locale);
    if (!fs.existsSync(localeDir)) {
      fs.mkdirSync(localeDir, { recursive: true });
    }
    const rssPath = path.join(localeDir, 'rss.xml');
    fs.writeFileSync(rssPath, rssXML, 'utf8');
    console.log(`RSS feed for locale "${locale}" generated at: ${rssPath}`);
  });
}

// Execute the RSS feed generation
generateRSSFeeds();
