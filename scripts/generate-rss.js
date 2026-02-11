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

const escapeHtml = value =>
  String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');

const wrapCdata = value => `<![CDATA[${String(value).replaceAll(']]>', ']]]]><![CDATA[>')}]]>`;

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

const markdownToHtml = markdown => {
  if (!markdown) {
    return '';
  }

  const lines = markdown.replace(/\r\n/g, '\n').split('\n');
  const html = [];
  let inCodeBlock = false;
  let codeLanguage = '';
  let codeLines = [];
  let inList = false;
  let paragraphLines = [];

  const flushParagraph = () => {
    if (paragraphLines.length > 0) {
      html.push(`<p>${paragraphLines.join(' ')}</p>`);
      paragraphLines = [];
    }
  };

  const flushList = () => {
    if (inList) {
      html.push('</ul>');
      inList = false;
    }
  };

  const flushCodeBlock = () => {
    if (!inCodeBlock) {
      return;
    }

    const className = codeLanguage ? ` class="language-${escapeHtml(codeLanguage)}"` : '';
    html.push(`<pre><code${className}>${escapeHtml(codeLines.join('\n'))}</code></pre>`);
    inCodeBlock = false;
    codeLanguage = '';
    codeLines = [];
  };

  lines.forEach(line => {
    const trimmedLine = line.trim();

    const codeBlockStartMatch = line.match(/^```([\w-]+)?\s*$/);
    if (codeBlockStartMatch) {
      flushParagraph();
      flushList();
      if (inCodeBlock) {
        flushCodeBlock();
      } else {
        inCodeBlock = true;
        codeLanguage = codeBlockStartMatch[1] || '';
      }
      return;
    }

    if (inCodeBlock) {
      codeLines.push(line);
      return;
    }

    if (!trimmedLine) {
      flushParagraph();
      flushList();
      return;
    }

    if (/^[-*_]{3,}$/.test(trimmedLine)) {
      flushParagraph();
      flushList();
      html.push('<hr />');
      return;
    }

    // Drop decorative spacing spans used in some markdown files.
    if (/^<span\b[^>]*>\s*<\/span>$/i.test(trimmedLine)) {
      flushParagraph();
      flushList();
      return;
    }

    const isRawHtmlLine =
      /^<([a-zA-Z][\w:-]*)(\s[^>]*)?>.*<\/\1>$/.test(trimmedLine) ||
      /^<([a-zA-Z][\w:-]*)(\s[^>]*)?\/>$/.test(trimmedLine) ||
      /^<([a-zA-Z][\w:-]*)(\s[^>]*)?>$/.test(trimmedLine) ||
      /^<\/([a-zA-Z][\w:-]*)>$/.test(trimmedLine);

    if (isRawHtmlLine) {
      flushParagraph();
      flushList();
      html.push(trimmedLine);
      return;
    }

    const headingMatch = line.match(/^(#{1,6})\s+(.+)$/);
    if (headingMatch) {
      flushParagraph();
      flushList();
      const level = Math.min(6, headingMatch[1].length);
      html.push(`<h${level}>${escapeHtml(headingMatch[2].trim())}</h${level}>`);
      return;
    }

    const listMatch = line.match(/^\s*[-*]\s+(.+)$/);
    if (listMatch) {
      flushParagraph();
      if (!inList) {
        inList = true;
        html.push('<ul>');
      }
      html.push(`<li>${escapeHtml(listMatch[1].trim())}</li>`);
      return;
    }

    paragraphLines.push(escapeHtml(trimmedLine));
  });

  flushParagraph();
  flushList();
  flushCodeBlock();
  return html.join('\n');
};

const getPostContentEncoded = (locale, postId) => {
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
  let title, description, copyright;
  if (locale === 'en') {
    title = "Şuayb's Blog";
    description = 'Explore the latest articles, tutorials, and insights.';
    copyright = `© 2024 Şuayb Şimşek. All rights reserved.`;
  } else if (locale === 'tr') {
    title = "Şuayb'in Blogu";
    description = 'En son makaleleri, eğitimleri ve analizleri keşfedin.';
    copyright = `© 2024 Şuayb Şimşek. Tüm hakları saklıdır.`;
  } else {
    title = 'Blog';
    description = 'Latest posts';
    copyright = '';
  }

  const alternateLocale = locale === 'en' ? 'tr' : 'en';

  // Sort posts by date (newest first)
  const sortedPosts = [...posts].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  const newestPubDate = sortedPosts[0]?.date ? new Date(sortedPosts[0].date).toUTCString() : new Date().toUTCString();

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
  rss += `    <pubDate>${newestPubDate}</pubDate>\n`;
  rss += `    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>\n`;
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
  sortedPosts.forEach(post => {
    const postUrl = buildSiteUrl(basePath, locale, 'posts', post.id);
    const publishedAt = new Date(post.date);
    const pubDate = publishedAt.toUTCString();
    const contentEncoded = getPostContentEncoded(locale, post.id);
    rss += `    <item>\n`;
    rss += `      <title>${wrapCdata(post.title)}</title>\n`;
    rss += `      <link>${postUrl}</link>\n`;
    rss += `      <description>${wrapCdata(post.summary)}</description>\n`;
    rss += `      <pubDate>${pubDate}</pubDate>\n`;
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
  });

  rss += `  </channel>\n`;
  rss += `</rss>\n`;

  return rss;
}

/**
 * Generates and writes the RSS feed for each locale.
 * The feed is written to build/{locale}/rss.xml.
 */
function generateRSSFeeds() {
  locales.forEach(locale => {
    const posts = readPosts(locale);
    const rssXML = generateRSSFeedXML(posts, locale);
    // Ensure the locale directory exists under build
    const localeDir = path.join(buildDir, locale);
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
