import fs from 'node:fs/promises';
import path from 'node:path';

const ROOT = process.cwd();
const LOCALES = ['en', 'tr'];
const OPTIONS = {
  rewrite: process.argv.includes('--rewrite'),
};

const stripTrailingEmptyLines = lines => {
  let end = lines.length - 1;
  while (end >= 0 && lines[end].trim() === '') end -= 1;
  return lines.slice(0, end + 1);
};

const splitFrontmatter = markdown => {
  if (!markdown.startsWith('---')) return { frontmatter: null, body: markdown };
  const end = markdown.indexOf('\n---', 3);
  if (end === -1) return { frontmatter: null, body: markdown };
  return {
    frontmatter: markdown.slice(0, end + 4).replace(/\s*$/, '\n'),
    body: markdown.slice(end + 4).replace(/^\s*\n/, ''),
  };
};

const parseFrontmatterValue = (frontmatter, key) => {
  if (!frontmatter) return null;
  const m = new RegExp(`^${key}:\\s*'([^']*)'\\s*$`, 'm').exec(frontmatter);
  return m?.[1] ?? null;
};

const lastNonEmptyBlock = lines => {
  let i = lines.length - 1;
  while (i >= 0 && lines[i].trim() === '') i -= 1;
  if (i < 0) return { start: 0, end: -1, block: [] };
  const end = i;
  while (i >= 0 && lines[i].trim() !== '') i -= 1;
  const start = i + 1;
  return { start, end, block: lines.slice(start, end + 1) };
};

const shortTitle = title => {
  if (!title) return '';
  return title
    .replace(/\s*\([^)]*\)\s*/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
};

const CUSTOM_CONCLUSION_BY_ID = {
  'spring-boot-configuration-properties': {
    en: 'You now have a type-safe Spring Boot configuration layer with startup validation and profile-based overrides. As a next step, externalize environment-specific secrets and add configuration tests to catch regressions early.',
    tr: 'Artık tip-güvenli, açılışta doğrulanan ve profile göre override edilebilen bir Spring Boot yapılandırma katmanın var. Sonraki adımda ortam bazlı gizli değerleri dışsallaştırıp regresyonları erken yakalamak için yapılandırma testleri ekleyin.',
  },
};

const normalizeConclusionSubject = (locale, title) => {
  const base = shortTitle(title) || (locale === 'tr' ? 'bu konu' : 'this topic');
  if (locale === 'tr') {
    return base
      .replace(/^Spring Boot ile\s+/iu, '')
      .replace(/^Spring Boot\s+ile\s+/iu, '')
      .trim();
  }
  return base;
};

const defaultConclusion = (locale, title, isSpringBoot) => {
  const base = normalizeConclusionSubject(locale, title);
  if (locale === 'en') {
    if (isSpringBoot) {
      return `You now have a practical ${base} implementation with a clear, production-friendly Spring Boot structure. As a next step, adapt configuration and tests to your own domain, then validate behavior under realistic traffic and failure scenarios.`;
    }
    return `You now have a practical ${base} implementation with a clear, production-friendly structure. As a next step, adapt configuration and tests to your own domain, then validate behavior under realistic traffic and failure scenarios.`;
  }

  if (isSpringBoot) {
    return `Artık ${base} için üretim odaklı bir Spring Boot temeliniz var. Sonraki adımda ayarları kendi domainine uyarlayıp test ve gözlemlenebilirlik katmanını ekleyerek gerçek trafik altında doğrulayın.`;
  }
  return `Artık ${base} için üretim odaklı bir temeliniz var. Sonraki adımda ayarları kendi domainine uyarlayıp test ve gözlemlenebilirlik katmanını ekleyerek gerçek trafik altında doğrulayın.`;
};

const hasSpringBootTopic = frontmatter => {
  if (!frontmatter) return false;
  return /-\s+id:\s+'spring-boot'\s*$/m.test(frontmatter);
};

const conclusionHeading = locale => (locale === 'tr' ? '## 🏁 Sonuç' : '## 🏁 Conclusion');

const conclusionAlreadyPresent = (bodyLines, locale) => {
  const heading = conclusionHeading(locale);
  const oldHeading = locale === 'tr' ? '## 🌟 Sonuç' : '## 🌟 Conclusion';
  return bodyLines.some(line => line.trim() === heading || line.trim() === oldHeading);
};

const isSummaryLikeBlock = (locale, text) => {
  const t = text.trim();
  if (!t) return false;
  if (locale === 'en') {
    return /^(This .* setup (delivers|provides)|By following these steps)/i.test(t);
  }
  return /^(Bu .* kurulum|Bu adımları takip)/i.test(t);
};

const cleanupPrefaceBeforeConclusion = (lines, locale) => {
  const newHeading = conclusionHeading(locale);
  const oldHeading = locale === 'tr' ? '## 🌟 Sonuç' : '## 🌟 Conclusion';

  const headingIndex = lines.findIndex(line => {
    const t = line.trim();
    return t === newHeading || t === oldHeading;
  });
  if (headingIndex === -1) return { lines, changed: false };

  // Look for a summary-like paragraph immediately above the conclusion heading, possibly wrapped by `---`.
  // Pattern we want to remove:
  // ---
  // <summary-like paragraph>
  // ---
  // ## 🏁 Conclusion
  let i = headingIndex - 1;
  while (i >= 0 && lines[i].trim() === '') i -= 1;

  // Optional separator right before heading.
  const hasLowerHr = i >= 0 && lines[i].trim() === '---';
  if (hasLowerHr) i -= 1;
  while (i >= 0 && lines[i].trim() === '') i -= 1;

  // Identify the paragraph block end at i, and find its start (blank-line delimited).
  if (i < 0) return { lines, changed: false };
  const paraEnd = i;
  while (i >= 0 && lines[i].trim() !== '') i -= 1;
  const paraStart = i + 1;
  const paraText = lines
    .slice(paraStart, paraEnd + 1)
    .join('\n')
    .trim();

  if (!isSummaryLikeBlock(locale, paraText)) return { lines, changed: false };

  // Optional separator above the paragraph.
  let removeStart = paraStart;
  let j = paraStart - 1;
  while (j >= 0 && lines[j].trim() === '') j -= 1;
  if (j >= 0 && lines[j].trim() === '---') {
    removeStart = j;
  }

  // Remove the paragraph and (optionally) the lower HR directly above the heading.
  let removeEnd = paraEnd;
  // Extend to include trailing blank lines after paragraph.
  let k = paraEnd + 1;
  while (k < lines.length && lines[k].trim() === '') k += 1;
  if (k < lines.length && lines[k].trim() === '---') {
    // This is the HR right before the conclusion heading.
    removeEnd = k;
  }

  const next = [...lines.slice(0, removeStart), ...lines.slice(removeEnd + 1)];
  return { lines: next, changed: true };
};

const isPlainParagraphBlock = blockLines => {
  if (!blockLines.length) return false;
  const text = blockLines.join('\n').trim();
  if (!text) return false;

  // Reject common markdown structures; we only want to remove trailing free-form paragraphs.
  const looksLikeHeading = blockLines.some(l => /^#{1,6}\s+/.test(l.trim()));
  if (looksLikeHeading) return false;
  const looksLikeList = blockLines.some(l => /^\s*(-|\*|\d+\.)\s+/.test(l));
  if (looksLikeList) return false;
  const looksLikeFence = blockLines.some(l => /^(```|~~~)/.test(l.trim()));
  if (looksLikeFence) return false;
  const looksLikeDirectiveFence = blockLines.some(l => /^:::+/.test(l.trim()) || /^@tab\b/.test(l.trim()));
  if (looksLikeDirectiveFence) return false;
  const looksLikeQuote = blockLines.some(l => /^\s*>/.test(l));
  if (looksLikeQuote) return false;
  const looksLikeTable = text.includes('|') && blockLines.some(l => /^\s*\|?[\w\s:-]+\|/.test(l));
  if (looksLikeTable) return false;
  const looksLikeHtml = /<\/?[a-z][\s\S]*>/i.test(text);
  if (looksLikeHtml) return false;

  // Heuristic: keep it short-ish so we don’t delete real sections.
  return text.length <= 420;
};

const cleanupTrailingParagraphBeforeConclusion = (lines, locale) => {
  const newHeading = conclusionHeading(locale);
  const oldHeading = locale === 'tr' ? '## 🌟 Sonuç' : '## 🌟 Conclusion';

  const headingIndex = lines.findIndex(line => {
    const t = line.trim();
    return t === newHeading || t === oldHeading;
  });
  if (headingIndex === -1) return { lines, changed: false };

  // Find the nearest '---' above the conclusion heading.
  let hrIdx = headingIndex - 1;
  while (hrIdx >= 0 && lines[hrIdx].trim() === '') hrIdx -= 1;
  if (hrIdx < 0 || lines[hrIdx].trim() !== '---') return { lines, changed: false };

  // Find the last non-empty block immediately above that HR.
  let i = hrIdx - 1;
  while (i >= 0 && lines[i].trim() === '') i -= 1;
  if (i < 0) return { lines, changed: false };
  const blockEnd = i;
  while (i >= 0 && lines[i].trim() !== '') i -= 1;
  const blockStart = i + 1;
  const block = lines.slice(blockStart, blockEnd + 1);

  if (!isPlainParagraphBlock(block)) return { lines, changed: false };

  // Remove the block + surrounding blank lines above it, but keep the HR.
  let removeStart = blockStart;
  let j = blockStart - 1;
  while (j >= 0 && lines[j].trim() === '') j -= 1;
  // Keep one blank line before the HR by trimming all whitespace in the removed range.
  const next = [...lines.slice(0, removeStart), ...lines.slice(hrIdx)];

  return { lines: next, changed: true };
};

const cleanupDuplicateHrBeforeConclusion = (lines, locale) => {
  const newHeading = conclusionHeading(locale);
  const oldHeading = locale === 'tr' ? '## 🌟 Sonuç' : '## 🌟 Conclusion';

  const headingIndex = lines.findIndex(line => {
    const t = line.trim();
    return t === newHeading || t === oldHeading;
  });
  if (headingIndex === -1) return { lines, changed: false };

  // Find the nearest '---' above the conclusion heading.
  let hrIdx = headingIndex - 1;
  while (hrIdx >= 0 && lines[hrIdx].trim() === '') hrIdx -= 1;
  if (hrIdx < 0 || lines[hrIdx].trim() !== '---') return { lines, changed: false };

  // If the previous non-empty line is also '---', remove the earlier one.
  let prev = hrIdx - 1;
  while (prev >= 0 && lines[prev].trim() === '') prev -= 1;
  if (prev >= 0 && lines[prev].trim() === '---') {
    const next = [...lines.slice(0, prev), ...lines.slice(hrIdx)];
    return { lines: next, changed: true };
  }

  return { lines, changed: false };
};

const rewriteConclusionParagraph = (lines, locale, conclusion) => {
  const newHeading = conclusionHeading(locale);
  const oldHeading = locale === 'tr' ? '## 🌟 Sonuç' : '## 🌟 Conclusion';

  const headingIndex = lines.findIndex(line => {
    const t = line.trim();
    return t === newHeading || t === oldHeading;
  });
  if (headingIndex === -1) return { lines, changed: false };

  let start = headingIndex + 1;
  while (start < lines.length && lines[start].trim() === '') start += 1;

  let end = start;
  while (end < lines.length && lines[end].trim() !== '') end += 1;

  const current = lines.slice(start, end).join(' ').replace(/\s+/g, ' ').trim();
  if (current === conclusion.trim()) return { lines, changed: false };

  const tail = lines.slice(end);
  while (tail.length && tail[0].trim() === '') tail.shift();

  const next = [...lines.slice(0, headingIndex + 1), '', conclusion];
  if (tail.length) next.push('', ...tail);
  return { lines: next, changed: true };
};

const standardizeFile = async (filePath, locale) => {
  const raw = await fs.readFile(filePath, 'utf8');
  const { frontmatter, body } = splitFrontmatter(raw);
  const originalLines = stripTrailingEmptyLines(body.split(/\r?\n/));

  const oldHeading = locale === 'tr' ? '## 🌟 Sonuç' : '## 🌟 Conclusion';
  const newHeading = conclusionHeading(locale);

  // If an old conclusion heading exists, migrate it to the new icon.
  let migratedLines = originalLines;
  let changed = false;
  const idx = migratedLines.findIndex(line => line.trim() === oldHeading);
  if (idx !== -1) {
    migratedLines = [...migratedLines];
    migratedLines[idx] = newHeading;
    changed = true;
  }

  const cleaned = cleanupPrefaceBeforeConclusion(migratedLines, locale);
  migratedLines = cleaned.lines;
  changed = changed || cleaned.changed;

  const cleaned2 = cleanupTrailingParagraphBeforeConclusion(migratedLines, locale);
  migratedLines = cleaned2.lines;
  changed = changed || cleaned2.changed;

  const cleaned3 = cleanupDuplicateHrBeforeConclusion(migratedLines, locale);
  migratedLines = cleaned3.lines;
  changed = changed || cleaned3.changed;

  const id = path.basename(filePath, '.md');
  const title = parseFrontmatterValue(frontmatter, 'title');
  const isSpringBoot = hasSpringBootTopic(frontmatter) || (title?.includes('Spring Boot') ?? false);
  const conclusion = CUSTOM_CONCLUSION_BY_ID[id]?.[locale] ?? defaultConclusion(locale, title, isSpringBoot);

  if (conclusionAlreadyPresent(migratedLines, locale)) {
    if (OPTIONS.rewrite) {
      const rewritten = rewriteConclusionParagraph(migratedLines, locale, conclusion);
      migratedLines = rewritten.lines;
      changed = changed || rewritten.changed;
    }
    if (changed) {
      const out = `${frontmatter ?? ''}${migratedLines.join('\n')}\n`;
      await fs.writeFile(filePath, out, 'utf8');
      return { changed: true };
    }
    // Keep existing conclusion; do not override in bulk.
    return { changed: false };
  }

  // If the file ends with a summary-like paragraph, drop it before adding a standardized Conclusion/Sonuç.
  const { start, end, block } = lastNonEmptyBlock(migratedLines);
  const blockText = block.join('\n').trim();
  let nextLines = migratedLines;
  if (isSummaryLikeBlock(locale, blockText)) {
    nextLines = [...migratedLines.slice(0, start), ...migratedLines.slice(end + 1)];
    nextLines = stripTrailingEmptyLines(nextLines);
  } else {
    nextLines = migratedLines;
  }

  const heading = newHeading;
  const appended = [...nextLines, '', '---', '', heading, '', conclusion, ''].join('\n');

  const out = `${frontmatter ?? ''}${appended}`;
  await fs.writeFile(filePath, out, 'utf8');
  return { changed: true };
};

const main = async () => {
  const touched = [];
  for (const locale of LOCALES) {
    const dir = path.join(ROOT, 'content', 'posts', locale);
    const files = (await fs.readdir(dir)).filter(name => name.endsWith('.md')).map(name => path.join(dir, name));

    for (const filePath of files) {
      const res = await standardizeFile(filePath, locale);
      if (res.changed) touched.push(path.relative(ROOT, filePath));
    }
  }

  console.log(`OK: updated ${touched.length} files.`);
  for (const fp of touched) console.log(`- ${fp}`);
};

main().catch(err => {
  console.error(err);
  process.exit(1);
});
