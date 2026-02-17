// scripts/generate-rss.js
const fs = require('node:fs');
const path = require('node:path');
const matter = require('gray-matter');

const i18nConfig = require('../i18n.config.json');
const locales = i18nConfig.locales;

const siteUrl = process.env.SITE_URL || 'https://suaybsimsek.com';
const normalizedSiteUrl = siteUrl.replace(/\/+$/g, '');
const basePath = (process.env.NEXT_PUBLIC_BASE_PATH || '').replace(/^\/+|\/+$/g, '');
const basePathPrefix = basePath ? `/${basePath}` : '';

const buildDir = path.join(process.cwd(), 'build');
const publicDir = path.join(process.cwd(), 'public');
const rssLanguageByLocale = {
  en: 'en-US',
  tr: 'tr-TR',
};

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

const getRssLanguage = locale => rssLanguageByLocale[locale] || locale;

const toValidDate = value => {
  if (typeof value !== 'string' || value.trim().length === 0) {
    return null;
  }

  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

const getPostPublishedAt = post => toValidDate(post.publishedDate) ?? toValidDate(post.updatedDate) ?? new Date();
const getPostUpdatedAt = post => toValidDate(post.updatedDate) ?? getPostPublishedAt(post);

const escapeHtml = value =>
  String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');

const wrapCdata = value => `<![CDATA[${String(value).replaceAll(']]>', ']]]]><![CDATA[>')}]]>`;

let markdownProcessorPromise = null;

const appendAttribute = (attributes, tagName, attributeName) => {
  const existing = Array.isArray(attributes[tagName]) ? attributes[tagName] : [];
  if (!existing.includes(attributeName)) {
    attributes[tagName] = [...existing, attributeName];
  }
};

const buildRssSanitizeSchema = defaultSchema => {
  const attributes = { ...(defaultSchema.attributes || {}) };
  appendAttribute(attributes, 'code', 'className');
  appendAttribute(attributes, 'pre', 'className');
  appendAttribute(attributes, 'span', 'className');
  appendAttribute(attributes, 'div', 'className');
  appendAttribute(attributes, 'a', 'target');
  appendAttribute(attributes, 'a', 'rel');

  return {
    ...defaultSchema,
    attributes,
  };
};

const loadMarkdownProcessor = async () => {
  if (!markdownProcessorPromise) {
    markdownProcessorPromise = (async () => {
      const [
        { unified },
        { default: remarkParse },
        { default: remarkGfm },
        { default: remarkRehype },
        { default: rehypeRaw },
        { default: rehypeSanitize },
        { default: rehypeStringify },
        { defaultSchema },
      ] = await Promise.all([
        import('unified'),
        import('remark-parse'),
        import('remark-gfm'),
        import('remark-rehype'),
        import('rehype-raw'),
        import('rehype-sanitize'),
        import('rehype-stringify'),
        import('hast-util-sanitize'),
      ]);

      return unified()
        .use(remarkParse)
        .use(remarkGfm)
        .use(remarkRehype, { allowDangerousHtml: true })
        .use(rehypeRaw)
        .use(rehypeSanitize, buildRssSanitizeSchema(defaultSchema))
        .use(rehypeStringify);
    })();
  }

  return markdownProcessorPromise;
};

const parseTabs = tabBlockContent =>
  tabBlockContent
    .split('@tab')
    .slice(1)
    .map(tab => {
      const [rawTitle, ...rest] = tab.trim().split('\n');
      const titleMatch = /^([a-zA-Z0-9\s]+?)(?:\s+\[icon=([a-zA-Z0-9_-]+)])?$/.exec(rawTitle || '');
      const title = titleMatch?.[1]?.trim() ?? '';

      return {
        title,
        content: rest.join('\n').trim(),
      };
    })
    .filter(tab => tab.content);

const resolveTabsToDefaultContent = markdown => {
  const tabSectionsRegex = /:::tabs([\s\S]*?):::/gm;
  return markdown.replace(tabSectionsRegex, (_, tabBlockContent) => {
    const tabs = parseTabs(String(tabBlockContent || ''));
    if (tabs.length === 0) {
      return '';
    }

    return tabs
      .map(tab => {
        const heading = tab.title ? `### ${tab.title}\n\n` : '';
        return `${heading}${tab.content}`.trim();
      })
      .join('\n\n');
  });
};

const markdownToHtml = async markdown => {
  if (!markdown) {
    return '';
  }

  try {
    const processor = await loadMarkdownProcessor();
    const file = await processor.process(markdown);
    return String(file);
  } catch (error) {
    console.warn('Falling back to escaped RSS HTML rendering due to markdown pipeline error:', error);
    return `<p>${escapeHtml(markdown)}</p>`;
  }
};

const getPostContentEncoded = async (locale, postId) => {
  const postPath = path.join(process.cwd(), 'content', 'posts', locale, `${postId}.md`);
  if (!fs.existsSync(postPath)) {
    return '';
  }

  try {
    const markdownFile = fs.readFileSync(postPath, 'utf8');
    const { content } = matter(markdownFile);
    return markdownToHtml(resolveTabsToDefaultContent(content));
  } catch (error) {
    console.warn(`Failed to read markdown for "${locale}/${postId}":`, error);
    return '';
  }
};

/**
 * Reads posts for a given locale from public data index.
 * @param {string} locale - The locale identifier (e.g., 'en' or 'tr').
 * @returns {Array} - Array of post objects.
 */
function readPosts(locale) {
  const postsJsonPath = path.join(process.cwd(), 'public', 'data', `posts.${locale}.json`);
  if (fs.existsSync(postsJsonPath)) {
    try {
      const parsed = JSON.parse(fs.readFileSync(postsJsonPath, 'utf8'));
      if (!Array.isArray(parsed)) {
        return [];
      }
      return parsed.filter(post => (post?.source === 'medium' ? false : true));
    } catch (error) {
      console.error(`Error reading/parsing posts index for locale "${locale}":`, error);
      return [];
    }
  } else {
    console.warn(`posts index not found for locale "${locale}" at ${postsJsonPath}`);
    return [];
  }
}

/**
 * Generates the RSS feed XML string using posts data.
 * @param {Array} posts - Array of post objects.
 * @param {string} locale - Locale to generate the feed for.
 * @returns {Promise<string>} - The RSS feed XML content.
 */
async function generateRSSFeedXML(posts, locale) {
  const currentYear = new Date().getFullYear();
  let title, description, copyright;
  if (locale === 'en') {
    title = "Şuayb's Blog";
    description = 'Explore the latest articles, tutorials, and insights.';
    copyright = `© ${currentYear} Şuayb Şimşek. All rights reserved.`;
  } else if (locale === 'tr') {
    title = "Şuayb'in Blogu";
    description = 'En son makaleleri, eğitimleri ve analizleri keşfedin.';
    copyright = `© ${currentYear} Şuayb Şimşek. Tüm hakları saklıdır.`;
  } else {
    title = 'Blog';
    description = 'Latest posts';
    copyright = '';
  }

  const alternateLocale = locale === 'en' ? 'tr' : 'en';

  // Sort posts by published date (newest first).
  const sortedPosts = [...posts].sort((a, b) => getPostPublishedAt(b).getTime() - getPostPublishedAt(a).getTime());
  const newestPublishedAt =
    sortedPosts.length > 0
      ? sortedPosts
          .map(getPostPublishedAt)
          .reduce((latest, current) => (current.getTime() > latest.getTime() ? current : latest))
      : new Date();
  const newestUpdatedAt =
    sortedPosts.length > 0
      ? sortedPosts
          .map(getPostUpdatedAt)
          .reduce((latest, current) => (current.getTime() > latest.getTime() ? current : latest))
      : new Date();

  let rss = `<?xml version="1.0" encoding="UTF-8"?>\n`;
  rss += `<?xml-stylesheet type="text/xsl" href="${basePathPrefix}/rss.xsl"?>\n`;
  rss += `<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom" xmlns:media="http://search.yahoo.com/mrss/" xmlns:content="http://purl.org/rss/1.0/modules/content/">\n`;
  rss += `  <channel>\n`;
  rss += `    <title>${wrapCdata(title)}</title>\n`;
  rss += `    <link>${buildSiteUrl(basePath, locale)}</link>\n`;
  rss += `    <description>${wrapCdata(description)}</description>\n`;
  rss += `    <docs>https://www.rssboard.org/rss-specification</docs>\n`;
  rss += `    <generator>${wrapCdata("Şuayb's Blog RSS Generator")}</generator>\n`;
  rss += `    <ttl>60</ttl>\n`;
  rss += `    <pubDate>${newestPublishedAt.toUTCString()}</pubDate>\n`;
  rss += `    <lastBuildDate>${newestUpdatedAt.toUTCString()}</lastBuildDate>\n`;
  rss += `    <atom:updated>${newestUpdatedAt.toISOString()}</atom:updated>\n`;
  rss += `    <language>${getRssLanguage(locale)}</language>\n`;
  rss += `    <copyright>${wrapCdata(copyright)}</copyright>\n`;
  rss += `    <image>\n`;
  rss += `      <url>${buildSiteUrl(basePath, 'images/logo.webp')}</url>\n`;
  rss += `      <title>${wrapCdata(title)}</title>\n`;
  rss += `      <link>${buildSiteUrl(basePath, locale)}</link>\n`;
  rss += `    </image>\n`;
  rss += `    <atom:link rel="self" type="application/rss+xml" href="${buildSiteUrl(basePath, locale, 'rss.xml')}" />\n`;
  rss += `    <atom:link rel="alternate" hreflang="${alternateLocale}" type="application/rss+xml" href="${buildSiteUrl(basePath, alternateLocale, 'rss.xml')}" />\n`;

  // Add each post
  for (const post of sortedPosts) {
    const postUrl = buildSiteUrl(basePath, locale, 'posts', post.id);
    const publishedAt = getPostPublishedAt(post);
    const updatedAt = getPostUpdatedAt(post);
    const pubDate = publishedAt.toUTCString();
    const contentEncoded = await getPostContentEncoded(locale, post.id);
    rss += `    <item>\n`;
    rss += `      <title>${wrapCdata(post.title)}</title>\n`;
    rss += `      <link>${postUrl}</link>\n`;
    rss += `      <description>${wrapCdata(post.summary)}</description>\n`;
    rss += `      <pubDate>${pubDate}</pubDate>\n`;
    rss += `      <atom:updated>${updatedAt.toISOString()}</atom:updated>\n`;
    rss += `      <guid isPermaLink="true">${postUrl}</guid>\n`;

    if (contentEncoded) {
      rss += `      <content:encoded>${wrapCdata(contentEncoded)}</content:encoded>\n`;
    }

    // Topics as <category>
    if (post.topics && Array.isArray(post.topics)) {
      post.topics.forEach(topic => {
        rss += `      <category><![CDATA[${topic.name}]]></category>\n`;
      });
    }

    // Thumbnail
    if (post.thumbnail) {
      const thumbnailUrl = toAbsoluteUrl(post.thumbnail);
      rss += `      <media:thumbnail url="${thumbnailUrl}" />\n`;
    }

    rss += `    </item>\n`;
  }

  rss += `  </channel>\n`;
  rss += `</rss>\n`;

  return rss;
}

/**
 * Generates and writes the RSS feed for each locale.
 * The feed is written to build/{locale}/rss.xml.
 */
async function generateRSSFeeds() {
  const outputRoots = [publicDir, buildDir].filter(root => fs.existsSync(root));

  for (const locale of locales) {
    const posts = readPosts(locale);
    const rssXML = await generateRSSFeedXML(posts, locale);

    outputRoots.forEach(root => {
      const localeDir = path.join(root, locale);
      if (!fs.existsSync(localeDir)) {
        fs.mkdirSync(localeDir, { recursive: true });
      }

      const rssPath = path.join(localeDir, 'rss.xml');
      fs.writeFileSync(rssPath, rssXML, 'utf8');
      console.log(`RSS feed for locale "${locale}" generated at: ${rssPath}`);
    });
  }
}

// Execute the RSS feed generation
generateRSSFeeds().catch(error => {
  console.error('RSS feed generation failed:', error);
  process.exitCode = 1;
});
