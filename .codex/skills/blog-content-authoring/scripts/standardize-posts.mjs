import fs from 'node:fs/promises';
import path from 'node:path';

const ROOT = process.cwd();
const LOCALES = ['en', 'tr'];

const OPTIONS = {
  dryRun: process.argv.includes('--dry-run'),
};

const isCodeFenceStart = line => /^(```|~~~)/.test(line.trim());

const leadingEmojiRe =
  /^(?<emoji>[\p{Extended_Pictographic}\p{Emoji_Presentation}][\p{Extended_Pictographic}\p{Emoji_Presentation}\uFE0F\u200D]*)\s+/u;

const normalizePrereqHeading = (locale, headingLevel, title) => {
  if (headingLevel !== '##') return null;

  if (locale === 'en') {
    if (/^Prerequisites$/i.test(title)) return '## 🌟 Prerequisites';
    return null;
  }

  // tr
  if (/^(Gereksinimler|Ön Koşullar|Ön Gereksinimler)$/u.test(title)) return '## 🌟 Gereksinimler';
  return null;
};

const parseStepHeading = (locale, title) => {
  // Returns { n, rest, normalizedLabel } or null.
  const trimmed = title.trim();

  // Turkish: numbered headings like "3. Something" used as step headings in some posts.
  if (locale === 'tr') {
    const trNumbered = /^(?<n>\d+)\.\s+(?<rest>.+)$/u.exec(trimmed);
    if (trNumbered?.groups) {
      const n = Number(trNumbered.groups.n);
      if (!Number.isFinite(n)) return null;
      return { n, rest: trNumbered.groups.rest.trim(), normalizedLabel: 'Adım' };
    }
  }

  const enMatch = /^(?:Step)\s+(?<n>\d+)\s*(?:[:\-])\s*(?<rest>.+)$/i.exec(trimmed);
  if (enMatch?.groups) {
    const n = Number(enMatch.groups.n);
    if (!Number.isFinite(n)) return null;
    return {
      n,
      rest: enMatch.groups.rest.trim(),
      normalizedLabel: locale === 'tr' ? 'Adım' : 'Step',
    };
  }

  if (locale !== 'tr') return null;

  const trMatch1 = /^(?:Adım)\s*(?<n>\d+)\s*(?:[:\-])\s*(?<rest>.+)$/iu.exec(trimmed);
  if (trMatch1?.groups) {
    const n = Number(trMatch1.groups.n);
    if (!Number.isFinite(n)) return null;
    return { n, rest: trMatch1.groups.rest.trim(), normalizedLabel: 'Adım' };
  }

  const trMatch2 = /^(?<n>\d+)\.\s*(?:Adım)\s*(?:[:\-])\s*(?<rest>.+)$/iu.exec(trimmed);
  if (trMatch2?.groups) {
    const n = Number(trMatch2.groups.n);
    if (!Number.isFinite(n)) return null;
    return { n, rest: trMatch2.groups.rest.trim(), normalizedLabel: 'Adım' };
  }

  return null;
};

const isTestingStep = (locale, text) => {
  const s = text.toLowerCase();
  if (locale === 'en') {
    return /\b(test|testing|verify|validation|validate|curl)\b/.test(s);
  }
  // tr
  return /\b(test|doğrula|dogrula|doğrulama|dogrulama|curl)\b/.test(s);
};

const isRunStep = (locale, text) => {
  const s = text.toLowerCase();
  if (locale === 'en') {
    return s.includes('run') || s.includes('start');
  }
  return s.includes('çalıştır') || s.includes('calistir') || s.includes('başlat') || s.includes('baslat');
};

const normalizeHeadingLine = (locale, line) => {
  const m = /^(?<hashes>#{2,6})\s+(?<rest>.+)$/.exec(line);
  if (!m?.groups) return line;

  const hashes = m.groups.hashes;
  const originalTitle = m.groups.rest;

  const emojiMatch = leadingEmojiRe.exec(originalTitle);
  const emoji = emojiMatch?.groups?.emoji ?? null;
  const title = emoji ? originalTitle.slice(emojiMatch[0].length).trim() : originalTitle.trim();

  // 1) Prerequisites normalization (locale-specific title + emoji)
  const prereq = normalizePrereqHeading(locale, hashes, title);
  if (prereq) return prereq;

  // 2) Step normalization (emoji + label format)
  const step = parseStepHeading(locale, title);
  if (step) {
    const stepEmoji = isTestingStep(locale, step.rest) ? '🧪' : isRunStep(locale, step.rest) ? '▶️' : '🛠️';
    const label = step.normalizedLabel;
    return `${hashes} ${stepEmoji} ${label} ${step.n}: ${step.rest}`;
  }

  // 3) Normalize/limit heading emojis to a small, consistent set.
  if (emoji) {
    const lower = title.toLowerCase();

    const looksLikeRunSection =
      (locale === 'en' && (lower.startsWith('running ') || lower.startsWith('run '))) ||
      (locale === 'tr' &&
        (lower.includes('çalıştır') ||
          lower.includes('calistir') ||
          lower.includes('başlat') ||
          lower.includes('baslat')));

    if (looksLikeRunSection) return `${hashes} ▶️ ${title}`;

    const looksLikeTestSection =
      (locale === 'en' && (lower === 'testing' || lower.startsWith('test '))) ||
      (locale === 'tr' && (lower === 'test etme' || lower.startsWith('test ')));

    if (looksLikeTestSection) return `${hashes} 🧪 ${title}`;

    if (emoji === '🛠') return `${hashes} 🛠️ ${title}`;

    // Keep 🌟, 🧪, ▶️; drop everything else.
    if (emoji === '🌟' || emoji === '🧪' || emoji === '▶️') return `${hashes} ${emoji} ${title}`;

    return `${hashes} ${title}`;
  }

  return line;
};

const standardizeFile = async (filePath, locale) => {
  const raw = await fs.readFile(filePath, 'utf8');
  const lines = raw.split(/\r?\n/);

  let changed = false;
  let inFence = false;

  const next = lines.map(line => {
    if (isCodeFenceStart(line)) {
      inFence = !inFence;
      return line;
    }
    if (inFence) return line;

    const normalized = normalizeHeadingLine(locale, line);
    if (normalized !== line) changed = true;
    return normalized;
  });

  if (!changed) return { changed: false };

  if (!OPTIONS.dryRun) {
    await fs.writeFile(filePath, next.join('\n'), 'utf8');
  }

  return { changed: true };
};

const main = async () => {
  const touched = [];

  for (const locale of LOCALES) {
    const dir = path.join(ROOT, 'content', 'posts', locale);
    const entries = await fs.readdir(dir);
    const files = entries.filter(name => name.endsWith('.md')).map(name => path.join(dir, name));

    for (const filePath of files) {
      const res = await standardizeFile(filePath, locale);
      if (res.changed) touched.push(path.relative(ROOT, filePath));
    }
  }

  if (OPTIONS.dryRun) {
    console.log(`DRY RUN: ${touched.length} files would be updated.`);
  } else {
    console.log(`OK: updated ${touched.length} files.`);
  }
  for (const fp of touched) console.log(`- ${fp}`);
};

main().catch(err => {
  console.error(err);
  process.exit(1);
});
