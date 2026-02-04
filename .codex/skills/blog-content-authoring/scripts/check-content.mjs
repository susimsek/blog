import fs from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';

const ROOT = process.cwd();

const LOCALES = ['en', 'tr'];
const ALLOWED_TOPIC_COLORS = new Set([
  'primary',
  'secondary',
  'success',
  'info',
  'warning',
  'danger',
  'light',
  'dark',
  'red',
  'green',
  'blue',
  'orange',
  'yellow',
  'purple',
  'gray',
  'brown',
  'pink',
  'cyan',
]);

const ALLOWED_TAB_ICONS = new Set(['java', 'kotlin', 'go', 'maven', 'gradle', 'javascript', 'typescript']);

const ALLOWED_HEADING_EMOJIS = new Set(['🌟', '📋', '🛠️', '🧪', '▶️', '🏁']);

const readJson = async filePath => {
  const raw = await fs.readFile(filePath, 'utf8');
  return JSON.parse(raw);
};

const exists = async filePath => {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
};

const isValidDate = s => typeof s === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(s) && !Number.isNaN(new Date(s).getTime());

const loadTopicsByLocale = async () => {
  const byLocale = new Map();
  for (const locale of LOCALES) {
    const p = path.join(ROOT, 'content', 'topics', locale, 'topics.json');
    const topics = await readJson(p);
    const byId = new Map(topics.map(t => [t.id, t]));
    byLocale.set(locale, { file: p, topics, byId });
  }
  return byLocale;
};

const loadPostsByLocale = async () => {
  const byLocale = new Map();
  for (const locale of LOCALES) {
    const p = path.join(ROOT, 'content', 'posts', locale, 'posts.json');
    const posts = await readJson(p);
    const byId = new Map(posts.map(post => [post.id, post]));
    byLocale.set(locale, { file: p, posts, byId });
  }
  return byLocale;
};

const fail = (errors, message) => errors.push(message);
const warn = (warnings, message) => warnings.push(message);

const isPlainParagraphBlock = blockLines => {
  if (!blockLines.length) return false;
  const text = blockLines.join('\n').trim();
  if (!text) return false;
  if (text.length > 420) return false;
  if (blockLines.some(l => /^#{1,6}\s+/.test(l.trim()))) return false;
  if (blockLines.some(l => /^\s*(-|\*|\d+\.)\s+/.test(l))) return false;
  if (blockLines.some(l => /^(```|~~~)/.test(l.trim()))) return false;
  if (blockLines.some(l => /^\s*>/.test(l))) return false;
  if (/<\/?[a-z][\s\S]*>/i.test(text)) return false;
  return true;
};

const isLikelyConclusionPreface = (blockLines, locale) => {
  if (!isPlainParagraphBlock(blockLines)) return false;
  const text = blockLines.join(' ').replace(/\s+/g, ' ').trim();
  const lower = text.toLowerCase();

  if (locale === 'tr') {
    const startsLike = /^(bu|şu)\s+(kurulum|yapılandırma|kurgu|yaklaşım)\b/u.test(lower);
    const hasVerb = /\b(sunar|sağlar|sağlıyor|sağlayan|sağlam|birleştirir|kombine)\b/u.test(lower);
    const hasAdjectives = /\b(sağlam|üretim[\s-]?hazır|güvenli|stateless|ölçeklenebilir)\b/u.test(lower);
    return (startsLike && hasVerb) || (startsLike && hasAdjectives);
  }

  const startsLike = /^(this|the)\s+(setup|configuration|approach|implementation)\b/.test(lower);
  const hasVerb = /\b(delivers|provides|offers|gives)\b/.test(lower);
  const hasAdjectives = /\b(robust|production[-\s]?ready|secure|stateless|scalable|best practices)\b/.test(lower);
  return (startsLike && hasVerb) || (startsLike && hasAdjectives);
};

const main = async () => {
  const errors = [];
  const warnings = [];
  const thumbnailMetaCache = new Map(); // publicPath -> { w, h, kb } | null

  const topicsByLocale = await loadTopicsByLocale();
  const postsByLocale = await loadPostsByLocale();

  // Cross-locale ID consistency
  const enPostIds = new Set(postsByLocale.get('en')?.posts.map(p => p.id) ?? []);
  const trPostIds = new Set(postsByLocale.get('tr')?.posts.map(p => p.id) ?? []);
  for (const id of enPostIds) if (!trPostIds.has(id)) fail(errors, `Post id missing in tr posts.json: ${id}`);
  for (const id of trPostIds) if (!enPostIds.has(id)) fail(errors, `Post id missing in en posts.json: ${id}`);

  const enTopicIds = new Set(topicsByLocale.get('en')?.topics.map(t => t.id) ?? []);
  const trTopicIds = new Set(topicsByLocale.get('tr')?.topics.map(t => t.id) ?? []);
  for (const id of enTopicIds) if (!trTopicIds.has(id)) fail(errors, `Topic id missing in tr topics.json: ${id}`);
  for (const id of trTopicIds) if (!enTopicIds.has(id)) fail(errors, `Topic id missing in en topics.json: ${id}`);

  // Validate posts
  for (const locale of LOCALES) {
    const { posts, file: postsFile } = postsByLocale.get(locale);
    const { byId: topicById, file: topicsFile } = topicsByLocale.get(locale);

    const seen = new Set();
    for (const post of posts) {
      if (!post?.id || typeof post.id !== 'string') {
        fail(errors, `${postsFile}: post is missing a string id`);
        continue;
      }
      if (seen.has(post.id)) fail(errors, `${postsFile}: duplicate post id: ${post.id}`);
      seen.add(post.id);

      if (!post.title || typeof post.title !== 'string') fail(errors, `${postsFile}: ${post.id} missing title`);
      if (!post.summary || typeof post.summary !== 'string') fail(errors, `${postsFile}: ${post.id} missing summary`);
      if (!isValidDate(post.date)) fail(errors, `${postsFile}: ${post.id} invalid date: ${post.date}`);

      if (typeof post.title === 'string' && /[()]/.test(post.title)) {
        warn(warnings, `${postsFile}: ${post.id} title should not contain parentheses: ${post.title}`);
      }

      if (typeof post.summary === 'string') {
        const summary = post.summary.trim();
        if (summary.length > 200) warn(warnings, `${postsFile}: ${post.id} summary is too long (>200 chars)`);
        if (summary.length > 0 && summary.length < 80)
          warn(warnings, `${postsFile}: ${post.id} summary is quite short (<80 chars)`);
      }

      if (post.thumbnail == null || typeof post.thumbnail !== 'string') {
        fail(errors, `${postsFile}: ${post.id} missing thumbnail`);
      } else {
        if (!post.thumbnail.startsWith('/images/'))
          warn(warnings, `${postsFile}: ${post.id} thumbnail should start with /images/: ${post.thumbnail}`);
        if (!post.thumbnail.endsWith('.webp'))
          warn(warnings, `${postsFile}: ${post.id} thumbnail should be .webp: ${post.thumbnail}`);
        const publicPath = path.join(ROOT, 'public', post.thumbnail.replace(/^\//, ''));
        if (!(await exists(publicPath)))
          fail(errors, `${postsFile}: ${post.id} thumbnail file not found: ${publicPath}`);
        if (await exists(publicPath)) {
          if (!thumbnailMetaCache.has(publicPath)) {
            try {
              const meta = await sharp(publicPath).metadata();
              const st = await fs.stat(publicPath);
              thumbnailMetaCache.set(publicPath, {
                w: meta.width ?? null,
                h: meta.height ?? null,
                kb: Math.round(st.size / 1024),
              });
            } catch {
              thumbnailMetaCache.set(publicPath, null);
            }
          }

          const info = thumbnailMetaCache.get(publicPath);
          if (!info) {
            warn(warnings, `${postsFile}: ${post.id} unable to read thumbnail metadata: ${publicPath}`);
          } else if (info.w !== 1200 || info.h !== 630) {
            warn(
              warnings,
              `${postsFile}: ${post.id} thumbnail should be 1200x630 (got ${info.w}x${info.h}): ${post.thumbnail}`,
            );
          } else if (info.kb != null && info.kb > 350) {
            warn(warnings, `${postsFile}: ${post.id} thumbnail is quite large (${info.kb}KB): ${post.thumbnail}`);
          }
        }
      }

      const mdPath = path.join(ROOT, 'content', 'posts', locale, `${post.id}.md`);
      if (!(await exists(mdPath))) fail(errors, `${postsFile}: ${post.id} markdown missing: ${mdPath}`);
      if (await exists(mdPath)) {
        const md = await fs.readFile(mdPath, 'utf8');
        const iconMatches = md.matchAll(/\[icon=([^\]]+)\]/g);
        for (const match of iconMatches) {
          const icon = match[1];
          if (!ALLOWED_TAB_ICONS.has(icon)) {
            warn(warnings, `${mdPath}: unknown tab icon "${icon}" (allowed: ${[...ALLOWED_TAB_ICONS].join(', ')})`);
          }
        }

        const headingLines = md.split(/\r?\n/).filter(line => /^#{2,6}\s+/.test(line));
        const conclusionHeading = locale === 'tr' ? '## 🏁 Sonuç' : '## 🏁 Conclusion';
        const oldConclusionHeading = locale === 'tr' ? '## 🌟 Sonuç' : '## 🌟 Conclusion';
        const conclusionCount = md.split(/\r?\n/).filter(line => line.trim() === conclusionHeading).length;
        const oldConclusionCount = md.split(/\r?\n/).filter(line => line.trim() === oldConclusionHeading).length;
        if (oldConclusionCount > 0) {
          warn(warnings, `${mdPath}: old conclusion heading found (${oldConclusionHeading})`);
        }
        if (conclusionCount > 1) {
          warn(warnings, `${mdPath}: multiple conclusion headings found (${conclusionCount}x ${conclusionHeading})`);
        }
        const hasConclusion = headingLines.some(line => line.trim() === conclusionHeading);
        if (!hasConclusion) {
          warn(warnings, `${mdPath}: missing conclusion heading (${conclusionHeading})`);
        } else {
          const lastHeading = [...headingLines].reverse().find(Boolean)?.trim();
          if (lastHeading && lastHeading !== conclusionHeading) {
            warn(warnings, `${mdPath}: conclusion heading should be the last section (${conclusionHeading})`);
          }

          // Ensure `---` exists right above the Conclusion heading (no extra paragraph in between).
          const lines = md.split(/\r?\n/);
          const idx = lines.findIndex(line => line.trim() === conclusionHeading);
          if (idx !== -1) {
            let j = idx - 1;
            while (j >= 0 && lines[j].trim() === '') j -= 1;
            if (j < 0 || lines[j].trim() !== '---') {
              warn(warnings, `${mdPath}: expected '---' immediately before conclusion heading`);
            } else {
              // Ensure there isn't a *conclusion-like* unheaded paragraph immediately before the final '---'.
              let k = j - 1;
              while (k >= 0 && lines[k].trim() === '') k -= 1;
              const blockEnd = k;
              while (k >= 0 && lines[k].trim() !== '') k -= 1;
              const blockStart = k + 1;
              const block = blockEnd >= 0 ? lines.slice(blockStart, blockEnd + 1) : [];
              if (isLikelyConclusionPreface(block, locale)) {
                warn(warnings, `${mdPath}: remove the unheaded paragraph right before the conclusion separator '---'`);
              }
            }
          }
        }
        for (const line of headingLines) {
          const m =
            /^#{2,6}\s+(?<emoji>[\p{Extended_Pictographic}\p{Emoji_Presentation}][\p{Extended_Pictographic}\p{Emoji_Presentation}\uFE0F\u200D]*)\s+/u.exec(
              line,
            );
          if (m?.groups?.emoji && !ALLOWED_HEADING_EMOJIS.has(m.groups.emoji)) {
            warn(warnings, `${mdPath}: non-standard heading emoji "${m.groups.emoji}" -> ${line.trim()}`);
          }

          const isStepLike = /\b(Step|Adım)\s+\d+:/u.test(line);
          if (isStepLike && !/^##\s+(🛠️|🧪|▶️)\s+(Step|Adım)\s+\d+:/u.test(line)) {
            warn(warnings, `${mdPath}: non-standard step heading format -> ${line.trim()}`);
          }
        }

        // Inline images in Markdown/HTML (optional, but enforce best practices).
        const inlineSrcs = new Set();
        for (const m of md.matchAll(/!\[[^\]]*]\(([^)\s]+)(?:\s+\"[^\"]*\")?\)/g)) inlineSrcs.add(m[1]);
        for (const m of md.matchAll(/<img[^>]+src=['"]([^'"]+)['"][^>]*>/gi)) inlineSrcs.add(m[1]);

        for (const src of inlineSrcs) {
          if (!src.startsWith('/images/')) {
            warn(warnings, `${mdPath}: inline image should be under /images/ (got "${src}")`);
            continue;
          }

          const publicImgPath = path.join(ROOT, 'public', src.replace(/^\//, ''));
          if (!(await exists(publicImgPath))) {
            fail(errors, `${mdPath}: inline image file not found: ${publicImgPath}`);
            continue;
          }

          if (!src.endsWith('.webp')) {
            warn(warnings, `${mdPath}: inline image should be .webp for consistency/perf: ${src}`);
          }

          // Recommended structure: /images/posts/<slug>/...
          const isThumbnail = src === post.thumbnail;
          if (!isThumbnail && !src.startsWith(`/images/posts/${post.id}/`)) {
            warn(warnings, `${mdPath}: inline images should live under /images/posts/${post.id}/ (got "${src}")`);
          }
        }
      }

      if (post.topics != null && !Array.isArray(post.topics)) {
        fail(errors, `${postsFile}: ${post.id} topics must be an array`);
      }

      for (const topic of post.topics ?? []) {
        if (!topic?.id || typeof topic.id !== 'string') {
          fail(errors, `${postsFile}: ${post.id} has a topic without id`);
          continue;
        }
        const canonical = topicById.get(topic.id);
        if (!canonical) {
          fail(errors, `${postsFile}: ${post.id} topic id not in ${topicsFile}: ${topic.id}`);
          continue;
        }

        if (!ALLOWED_TOPIC_COLORS.has(topic.color)) {
          fail(errors, `${postsFile}: ${post.id} topic ${topic.id} has invalid color: ${topic.color}`);
        }

        if (topic.name && canonical.name && topic.name !== canonical.name) {
          warn(
            warnings,
            `${postsFile}: ${post.id} topic name differs for ${topic.id} ("${topic.name}" vs "${canonical.name}")`,
          );
        }
        if (topic.color && canonical.color && topic.color !== canonical.color) {
          warn(
            warnings,
            `${postsFile}: ${post.id} topic color differs for ${topic.id} ("${topic.color}" vs "${canonical.color}")`,
          );
        }
      }
    }
  }

  if (warnings.length) {
    console.warn(`Warnings (${warnings.length}):`);
    for (const w of warnings) console.warn(`- ${w}`);
  }

  if (errors.length) {
    console.error(`Errors (${errors.length}):`);
    for (const e of errors) console.error(`- ${e}`);
    process.exit(1);
  }

  console.log('OK: content checks passed');
};

main().catch(err => {
  console.error(err);
  process.exit(1);
});
