import fs from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';

const ROOT = process.cwd();
const LOCALES = ['en', 'tr'];

const readJson = async filePath => JSON.parse(await fs.readFile(filePath, 'utf8'));

const percentile = (sorted, q) => sorted[Math.floor((sorted.length - 1) * q)];

const collectInlineImageSrcs = markdown => {
  const srcs = new Set();

  // Markdown: ![alt](url "title")
  for (const m of markdown.matchAll(/!\[[^\]]*]\(([^)\s]+)(?:\s+\"[^\"]*\")?\)/g)) {
    srcs.add(m[1]);
  }

  // HTML: <img ... src="...">
  for (const m of markdown.matchAll(/<img[^>]+src=['"]([^'"]+)['"][^>]*>/gi)) {
    srcs.add(m[1]);
  }

  return [...srcs];
};

const main = async () => {
  const uniqueThumbnails = new Map(); // src -> { refs: [...] }
  const inlineImages = new Map(); // src -> { refs: [...] }

  for (const locale of LOCALES) {
    const postsJsonPath = path.join(ROOT, 'content', 'posts', locale, 'posts.json');
    const posts = await readJson(postsJsonPath);

    for (const post of posts) {
      if (typeof post.thumbnail === 'string') {
        const key = post.thumbnail;
        const entry = uniqueThumbnails.get(key) ?? { refs: [] };
        entry.refs.push(`${locale}:${post.id}`);
        uniqueThumbnails.set(key, entry);
      }

      const mdPath = path.join(ROOT, 'content', 'posts', locale, `${post.id}.md`);
      const md = await fs.readFile(mdPath, 'utf8');
      for (const src of collectInlineImageSrcs(md)) {
        const entry = inlineImages.get(src) ?? { refs: [] };
        entry.refs.push(`${locale}:${post.id}`);
        inlineImages.set(src, entry);
      }
    }
  }

  const thumbStats = [];
  for (const [src] of uniqueThumbnails) {
    if (!src.startsWith('/images/')) continue;
    const publicPath = path.join(ROOT, 'public', src.replace(/^\//, ''));
    try {
      const meta = await sharp(publicPath).metadata();
      const st = await fs.stat(publicPath);
      thumbStats.push({
        src,
        w: meta.width ?? null,
        h: meta.height ?? null,
        kb: Math.round(st.size / 1024),
      });
    } catch {
      thumbStats.push({ src, w: null, h: null, kb: null });
    }
  }

  const sizes = thumbStats
    .map(s => s.kb)
    .filter(Boolean)
    .sort((a, b) => a - b);
  console.log(`Unique thumbnails: ${uniqueThumbnails.size}`);
  console.log(`Inline images referenced in Markdown: ${inlineImages.size}`);

  if (sizes.length) {
    console.log(
      `Thumbnail size (KB) p50/p90/max: ${percentile(sizes, 0.5)}/${percentile(sizes, 0.9)}/${sizes[sizes.length - 1]}`,
    );
  }

  const badDims = thumbStats.filter(s => s.w !== 1200 || s.h !== 630);
  if (badDims.length) {
    console.log(`Thumbnails with non-1200x630 dimensions: ${badDims.length}`);
    for (const item of badDims.slice(0, 20)) console.log(`- ${item.src} (${item.w}x${item.h})`);
  } else {
    console.log('All thumbnails are 1200x630.');
  }

  const nonLocalInline = [...inlineImages.keys()].filter(src => !src.startsWith('/images/'));
  if (nonLocalInline.length) {
    console.log(`Inline images not under /images/: ${nonLocalInline.length}`);
    for (const src of nonLocalInline.slice(0, 20)) console.log(`- ${src}`);
  }
};

main().catch(err => {
  console.error(err);
  process.exit(1);
});
