// scripts/generate-sitemaps.js
const fs = require('fs');
const path = require('path');

const siteUrl = 'https://suaybsimsek.com';
const locales = ['en', 'tr'];

/** -------------- POSTS SITEMAP GENERATION -------------- **/

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
 * Groups posts by their ID across locales.
 * @returns {Object} - An object where keys are post IDs and values are objects mapping locale to post data.
 */
function groupPostsById() {
  const postsById = {};
  locales.forEach(locale => {
    const posts = readPosts(locale);
    posts.forEach(post => {
      if (!postsById[post.id]) {
        postsById[post.id] = {};
      }
      postsById[post.id][locale] = post;
    });
  });
  return postsById;
}

/**
 * Generates the XML sitemap content for posts.
 * @param {Object} postsById - Posts grouped by ID.
 * @returns {string} - The XML sitemap string.
 */
function generatePostsSitemapXML(postsById) {
  let sitemap = `<?xml version="1.0" encoding="UTF-8"?>\n`;
  sitemap += `<?xml-stylesheet type="text/xsl" href="/sitemap.xsl"?>\n`;
  sitemap += `<urlset\n`;
  sitemap += `  xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"\n`;
  sitemap += `  xmlns:xhtml="http://www.w3.org/1999/xhtml"\n`;
  sitemap += `  xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">\n\n`;

  Object.keys(postsById).forEach(postId => {
    const localesForPost = Object.keys(postsById[postId]);
    localesForPost.forEach(locale => {
      const post = postsById[postId][locale];
      const postUrl = `${siteUrl}/${locale}/posts/${post.id}`;
      const thumbnailUrl = post.thumbnail.startsWith('/') ? `${siteUrl}${post.thumbnail}` : post.thumbnail;

      sitemap += `  <url>\n`;
      sitemap += `    <loc>${postUrl}</loc>\n`;
      sitemap += `    <lastmod>${new Date().toISOString()}</lastmod>\n`;
      sitemap += `    <changefreq>weekly</changefreq>\n`;
      sitemap += `    <image:image>\n`;
      sitemap += `      <image:loc>${thumbnailUrl}</image:loc>\n`;
      sitemap += `      <image:title>${post.title}</image:title>\n`;
      sitemap += `    </image:image>\n`;
      // Add alternate language links for all locales where the post exists
      localesForPost.forEach(altLocale => {
        const altUrl = `${siteUrl}/${altLocale}/posts/${post.id}`;
        sitemap += `    <xhtml:link rel="alternate" hreflang="${altLocale}" href="${altUrl}"/>\n`;
      });
      sitemap += `  </url>\n\n`;
    });
  });

  sitemap += `</urlset>\n`;
  return sitemap;
}

/**
 * Writes the posts sitemap XML to the public folder.
 */
function generatePostsSitemap() {
  const postsById = groupPostsById();
  const sitemapXML = generatePostsSitemapXML(postsById);
  const sitemapPath = path.join(process.cwd(), 'public', 'post-sitemap.xml');
  fs.writeFileSync(sitemapPath, sitemapXML, 'utf8');
  console.log('Posts sitemap generated at:', sitemapPath);
}

/** -------------- TOPICS SITEMAP GENERATION -------------- **/

/**
 * Reads topics for a given locale from topics.json.
 * @param {string} locale - The locale identifier.
 * @returns {Array} - Array of topic objects.
 */
function readTopics(locale) {
  const topicsJsonPath = path.join(process.cwd(), 'content', 'topics', locale, 'topics.json');
  if (fs.existsSync(topicsJsonPath)) {
    try {
      return JSON.parse(fs.readFileSync(topicsJsonPath, 'utf8'));
    } catch (error) {
      console.error(`Error reading/parsing topics.json for locale "${locale}":`, error);
      return [];
    }
  } else {
    console.warn(`topics.json not found for locale "${locale}" at ${topicsJsonPath}`);
    return [];
  }
}

/**
 * Groups topics by their ID across locales.
 * @returns {Object} - An object where keys are topic IDs and values are objects mapping locale to topic data.
 */
function groupTopicsById() {
  const topicsById = {};
  locales.forEach(locale => {
    const topics = readTopics(locale);
    topics.forEach(topic => {
      if (!topicsById[topic.id]) {
        topicsById[topic.id] = {};
      }
      topicsById[topic.id][locale] = topic;
    });
  });
  return topicsById;
}

/**
 * Generates the XML sitemap content for topics.
 * @param {Object} topicsById - Topics grouped by ID.
 * @returns {string} - The XML sitemap string.
 */
function generateTopicsSitemapXML(topicsById) {
  let sitemap = `<?xml version="1.0" encoding="UTF-8"?>\n`;
  sitemap += `<?xml-stylesheet type="text/xsl" href="/sitemap.xsl"?>\n`;
  sitemap += `<urlset\n`;
  sitemap += `  xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"\n`;
  sitemap += `  xmlns:xhtml="http://www.w3.org/1999/xhtml">\n\n`;

  Object.keys(topicsById).forEach(topicId => {
    const localesForTopic = Object.keys(topicsById[topicId]);
    localesForTopic.forEach(locale => {
      const topic = topicsById[topicId][locale];
      const topicUrl = `${siteUrl}/${locale}/topics/${topic.id}`;

      sitemap += `  <url>\n`;
      sitemap += `    <loc>${topicUrl}</loc>\n`;
      sitemap += `    <lastmod>${new Date().toISOString()}</lastmod>\n`;
      sitemap += `    <changefreq>weekly</changefreq>\n`;
      // Add alternate language links for all locales where the topic exists
      localesForTopic.forEach(altLocale => {
        const altUrl = `${siteUrl}/${altLocale}/topics/${topic.id}`;
        sitemap += `    <xhtml:link rel="alternate" hreflang="${altLocale}" href="${altUrl}"/>\n`;
      });
      sitemap += `  </url>\n\n`;
    });
  });

  sitemap += `</urlset>\n`;
  return sitemap;
}

/**
 * Writes the topics sitemap XML to the public folder.
 */
function generateTopicsSitemap() {
  const topicsById = groupTopicsById();
  const sitemapXML = generateTopicsSitemapXML(topicsById);
  const sitemapPath = path.join(process.cwd(), 'public', 'post_topic-sitemap.xml');
  fs.writeFileSync(sitemapPath, sitemapXML, 'utf8');
  console.log('Topics sitemap generated at:', sitemapPath);
}

/** -------------- MAIN -------------- **/

/**
 * Main function that generates both posts and topics sitemaps.
 */
function generateAllSitemaps() {
  generatePostsSitemap();
  generateTopicsSitemap();
}

// Execute the main function
generateAllSitemaps();
