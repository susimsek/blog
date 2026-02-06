const fs = require('node:fs');
const path = require('node:path');

const siteUrl = process.env.SITE_URL || 'https://suaybsimsek.com';
const normalizedSiteUrl = siteUrl.replace(/\/+$/g, '');
const basePath = (process.env.NEXT_PUBLIC_BASE_PATH || '').replace(/^\/+|\/+$/g, '');

const buildDir = path.join(process.cwd(), 'build');
const robotsPath = path.join(buildDir, 'robots.txt');

const normalizeSegment = segment =>
  String(segment)
    .trim()
    .replace(/^\/+|\/+$/g, '');

const buildSiteUrl = (...segments) => {
  const normalizedSegments = segments.map(normalizeSegment).filter(Boolean);
  return normalizedSegments.length > 0 ? `${normalizedSiteUrl}/${normalizedSegments.join('/')}` : normalizedSiteUrl;
};

const sitemapUrl = buildSiteUrl(basePath, 'sitemap_index.xml');

const robotsContent = `# *
User-agent: *
Disallow:

# Sitemaps
Sitemap: ${sitemapUrl}
`;

fs.writeFileSync(robotsPath, robotsContent, 'utf8');
console.log('Robots file generated at:', robotsPath);
