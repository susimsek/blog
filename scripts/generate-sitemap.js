// scripts/generate-sitemap.js
const fs = require('node:fs');
const path = require('node:path');

const i18nConfig = require('../i18n.config.json');
const locales = i18nConfig.locales;

const siteUrl = process.env.SITE_URL || 'https://suaybsimsek.com';
const normalizedSiteUrl = siteUrl.replace(/\/+$/g, '');
const basePath = (process.env.NEXT_PUBLIC_BASE_PATH || '').replace(/^\/+|\/+$/g, '');
const basePathPrefix = basePath ? `/${basePath}` : '';

const buildDir = path.join(process.cwd(), 'build');
const generatedAt = new Date().toISOString();

const toIsoTimestamp = value => {
  if (!value) {
    return generatedAt;
  }
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? generatedAt : parsed.toISOString();
};

const getFileLastModified = filePath => {
  try {
    return fs.statSync(filePath).mtime.toISOString();
  } catch {
    return generatedAt;
  }
};

const xmlEscape = value =>
  String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&apos;');

const normalizeSegment = segment =>
  String(segment)
    .trim()
    .replace(/^\/+|\/+$/g, '');

const buildSiteUrl = (...segments) => {
  const normalizedSegments = segments.map(normalizeSegment).filter(Boolean);
  return normalizedSegments.length > 0 ? `${normalizedSiteUrl}/${normalizedSegments.join('/')}` : normalizedSiteUrl;
};

const toAbsoluteUrl = value => {
  if (!value) {
    return '';
  }
  if (/^https?:\/\//i.test(value)) {
    return value;
  }
  return buildSiteUrl(basePath, value);
};

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
  sitemap += `<?xml-stylesheet type="text/xsl" href="${xmlEscape(`${basePathPrefix}/sitemap.xsl`)}"?>\n`;
  sitemap += `<urlset\n`;
  sitemap += `  xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"\n`;
  sitemap += `  xmlns:xhtml="http://www.w3.org/1999/xhtml"\n`;
  sitemap += `  xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">\n\n`;

  Object.keys(postsById).forEach(postId => {
    const localesForPost = Object.keys(postsById[postId]);
    localesForPost.forEach(locale => {
      const post = postsById[postId][locale];
      const postUrl = buildSiteUrl(basePath, locale, 'posts', post.id);
      const thumbnailUrl = toAbsoluteUrl(post.thumbnail);
      const postLastMod = toIsoTimestamp(post.date);

      sitemap += `  <url>\n`;
      sitemap += `    <loc>${xmlEscape(postUrl)}</loc>\n`;
      sitemap += `    <lastmod>${postLastMod}</lastmod>\n`;
      sitemap += `    <changefreq>weekly</changefreq>\n`;
      if (thumbnailUrl) {
        sitemap += `    <image:image>\n`;
        sitemap += `      <image:loc>${xmlEscape(thumbnailUrl)}</image:loc>\n`;
        sitemap += `      <image:title>${xmlEscape(post.title)}</image:title>\n`;
        sitemap += `    </image:image>\n`;
      }
      // Add alternate language links for all locales where the post exists
      localesForPost.forEach(altLocale => {
        const altUrl = buildSiteUrl(basePath, altLocale, 'posts', post.id);
        sitemap += `    <xhtml:link rel="alternate" hreflang="${xmlEscape(altLocale)}" href="${xmlEscape(altUrl)}"/>\n`;
      });
      sitemap += `  </url>\n\n`;
    });
  });

  sitemap += `</urlset>\n`;
  return sitemap;
}

/**
 * Writes the posts sitemap XML to the build folder.
 */
function generatePostsSitemap() {
  const postsById = groupPostsById();
  const sitemapXML = generatePostsSitemapXML(postsById);
  const sitemapPath = path.join(buildDir, 'post-sitemap.xml');
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
  sitemap += `<?xml-stylesheet type="text/xsl" href="${xmlEscape(`${basePathPrefix}/sitemap.xsl`)}"?>\n`;
  sitemap += `<urlset\n`;
  sitemap += `  xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"\n`;
  sitemap += `  xmlns:xhtml="http://www.w3.org/1999/xhtml">\n\n`;

  Object.keys(topicsById).forEach(topicId => {
    const localesForTopic = Object.keys(topicsById[topicId]);
    localesForTopic.forEach(locale => {
      const topic = topicsById[topicId][locale];
      const topicUrl = buildSiteUrl(basePath, locale, 'topics', topic.id);
      const topicLastMod = getFileLastModified(path.join(process.cwd(), 'content', 'topics', locale, 'topics.json'));

      sitemap += `  <url>\n`;
      sitemap += `    <loc>${xmlEscape(topicUrl)}</loc>\n`;
      sitemap += `    <lastmod>${topicLastMod}</lastmod>\n`;
      sitemap += `    <changefreq>weekly</changefreq>\n`;
      // Add alternate language links for all locales where the topic exists
      localesForTopic.forEach(altLocale => {
        const altUrl = buildSiteUrl(basePath, altLocale, 'topics', topic.id);
        sitemap += `    <xhtml:link rel="alternate" hreflang="${xmlEscape(altLocale)}" href="${xmlEscape(altUrl)}"/>\n`;
      });
      sitemap += `  </url>\n\n`;
    });
  });

  sitemap += `</urlset>\n`;
  return sitemap;
}

/**
 * Writes the topics sitemap XML to the build folder.
 */
function generateTopicsSitemap() {
  const topicsById = groupTopicsById();
  const sitemapXML = generateTopicsSitemapXML(topicsById);
  const sitemapPath = path.join(buildDir, 'post_topic-sitemap.xml');
  fs.writeFileSync(sitemapPath, sitemapXML, 'utf8');
  console.log('Topics sitemap generated at:', sitemapPath);
}

/** -------------- PAGES SITEMAP GENERATION -------------- **/

/**
 * Returns static page data for the sitemap.
 * Each page object contains a slug ('' for home), change frequency, and image info.
 * The image title is provided per locale.
 * @returns {Array} - Array of page objects.
 */
function getPagesData() {
  return [
    {
      slug: '', // Home page
      changefreq: 'daily',
      sourceFile: 'src/app/[locale]/page.tsx',
      image: {
        loc: '/images/logo.webp',
        title: { en: "Welcome to Şuayb's Blog", tr: "Şuayb'in Bloguna Hoş Geldiniz" },
      },
    },
    {
      slug: 'about',
      changefreq: 'monthly',
      sourceFile: 'src/app/[locale]/about/page.tsx',
      image: {
        loc: '/images/profile.webp',
        title: { en: 'About', tr: 'Hakkımda' },
      },
    },
    {
      slug: 'contact',
      changefreq: 'monthly',
      sourceFile: 'src/app/[locale]/contact/page.tsx',
      image: {
        loc: '/images/profile.webp',
        title: { en: 'Contact Information', tr: 'İletişim Bilgileri' },
      },
    },
    {
      slug: 'medium',
      changefreq: 'daily',
      sourceFile: 'src/app/[locale]/medium/page.tsx',
      image: {
        loc: '/images/medium.webp',
        title: {
          en: 'Medium Articles',
          tr: 'Medium Yazıları',
        },
      },
    },
  ];
}

/**
 * Generates the XML sitemap content for static pages.
 * @param {Array} pages - Array of page objects.
 * @returns {string} - The XML sitemap string.
 */
function generatePagesSitemapXML(pages) {
  let sitemap = `<?xml version="1.0" encoding="UTF-8"?>\n`;
  sitemap += `<?xml-stylesheet type="text/xsl" href="${xmlEscape(`${basePathPrefix}/sitemap.xsl`)}"?>\n`;
  sitemap += `<urlset\n`;
  sitemap += `  xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"\n`;
  sitemap += `  xmlns:xhtml="http://www.w3.org/1999/xhtml"\n`;
  sitemap += `  xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">\n\n`;

  pages.forEach(page => {
    locales.forEach(locale => {
      // Construct the page URL; if slug is empty, it's the home page URL.
      const pageUrl = page.slug ? buildSiteUrl(basePath, locale, page.slug) : buildSiteUrl(basePath, locale);
      const pageLastMod = getFileLastModified(path.join(process.cwd(), page.sourceFile));
      sitemap += `  <url>\n`;
      sitemap += `    <loc>${xmlEscape(pageUrl)}</loc>\n`;
      sitemap += `    <lastmod>${pageLastMod}</lastmod>\n`;
      sitemap += `    <changefreq>${page.changefreq}</changefreq>\n`;
      // Image details: build absolute URL and choose title based on locale.
      const imageUrl = toAbsoluteUrl(page.image.loc);
      const imageTitle = page.image.title[locale] || page.image.title.en;
      sitemap += `    <image:image>\n`;
      sitemap += `      <image:loc>${xmlEscape(imageUrl)}</image:loc>\n`;
      sitemap += `      <image:title>${xmlEscape(imageTitle)}</image:title>\n`;
      sitemap += `    </image:image>\n`;
      // Add alternate language links
      locales.forEach(altLocale => {
        const altUrl = page.slug ? buildSiteUrl(basePath, altLocale, page.slug) : buildSiteUrl(basePath, altLocale);
        sitemap += `    <xhtml:link rel="alternate" hreflang="${xmlEscape(altLocale)}" href="${xmlEscape(altUrl)}"/>\n`;
      });
      sitemap += `  </url>\n\n`;
    });
  });

  sitemap += `</urlset>\n`;
  return sitemap;
}

/**
 * Writes the pages sitemap XML to the build folder.
 */
function generatePagesSitemap() {
  const pages = getPagesData();
  const sitemapXML = generatePagesSitemapXML(pages);
  const sitemapPath = path.join(buildDir, 'page-sitemap.xml');
  fs.writeFileSync(sitemapPath, sitemapXML, 'utf8');
  console.log('Pages sitemap generated at:', sitemapPath);
}

/** -------------- SITEMAP INDEX GENERATION -------------- **/

/**
 * Generates the XML content for the sitemap index.
 * This index references the pages, posts, and topics sitemap files.
 * @returns {string} - The sitemap index XML string.
 */
function generateSitemapIndexXML() {
  let sitemapIndex = `<?xml version="1.0" encoding="UTF-8"?>\n`;
  sitemapIndex += `<?xml-stylesheet type="text/xsl" href="${xmlEscape(`${basePathPrefix}/sitemap.xsl`)}"?>\n`;
  sitemapIndex += `<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n\n`;

  const sitemapFiles = ['page-sitemap.xml', 'post-sitemap.xml', 'post_topic-sitemap.xml'];
  sitemapFiles.forEach(file => {
    const sitemapLastMod = getFileLastModified(path.join(buildDir, file));
    sitemapIndex += `  <sitemap>\n`;
    sitemapIndex += `    <loc>${xmlEscape(buildSiteUrl(basePath, file))}</loc>\n`;
    sitemapIndex += `    <lastmod>${sitemapLastMod}</lastmod>\n`;
    sitemapIndex += `  </sitemap>\n\n`;
  });

  sitemapIndex += `</sitemapindex>\n`;
  return sitemapIndex;
}

/**
 * Writes the sitemap index XML to the build folder.
 */
function generateSitemapIndex() {
  const sitemapIndexXML = generateSitemapIndexXML();
  const sitemapIndexPath = path.join(buildDir, 'sitemap_index.xml');
  fs.writeFileSync(sitemapIndexPath, sitemapIndexXML, 'utf8');
  console.log('Sitemap index generated at:', sitemapIndexPath);
}

/** -------------- MAIN -------------- **/

/**
 * Main function that generates posts, topics, pages, and sitemap index.
 */
function generateAllSitemaps() {
  generatePagesSitemap();
  generatePostsSitemap();
  generateTopicsSitemap();
  generateSitemapIndex();
}

// Execute the main function
generateAllSitemaps();
