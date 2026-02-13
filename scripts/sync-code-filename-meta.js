const fs = require('node:fs/promises');
const path = require('node:path');

const ROOT = process.cwd();
const LOCALES = ['en', 'tr'];
const POSTS_ROOT = path.join(ROOT, 'content', 'posts');

const TERMINAL_LANGUAGES = new Set(['bash', 'sh', 'shell', 'zsh', 'console', 'terminal', 'powershell', 'ps1', 'cmd']);
const LANG_ALIASES = {
  shell: 'bash',
  sh: 'bash',
  yml: 'yaml',
  plaintext: 'text',
};

const FILENAME_TOKEN_PATTERN = /([A-Za-z0-9_./-]+\.[A-Za-z][A-Za-z0-9]{1,9})/;

const normalizeLang = lang => {
  if (!lang) return '';
  const normalized = lang.toLowerCase();
  return LANG_ALIASES[normalized] ?? normalized;
};

const hasFilenameMeta = meta => /\b(filename|file|title|path)\s*=/.test(meta);

const extractHeadingFileName = line => {
  const headingMatch = /^#{2,6}\s+(.+)$/.exec(line.trim());
  if (!headingMatch) return null;

  const raw = headingMatch[1].replace(/`/g, '').replace(/\*/g, '').trim();
  const token = raw.match(FILENAME_TOKEN_PATTERN);
  return token ? token[1] : null;
};

const findNearestHeadingFileName = (lines, codeStartIndex) => {
  for (let i = codeStartIndex - 1; i >= 0; i -= 1) {
    const line = lines[i];
    const candidate = extractHeadingFileName(line);
    if (candidate) return candidate;
    if (/^#{2,6}\s+/.test(line.trim())) return null;
  }
  return null;
};

const inferClassFileName = (codeText, extension) => {
  const classLikeMatch =
    /\b(?:public\s+)?(?:final\s+)?(?:data\s+)?(?:class|interface|enum|record|object)\s+([A-Z][A-Za-z0-9_]*)\b/.exec(
      codeText,
    );
  return classLikeMatch?.[1] ? `${classLikeMatch[1]}.${extension}` : null;
};

const inferFallbackFileName = (lang, codeText) => {
  const normalized = normalizeLang(lang);
  if (!normalized || normalized === 'text') return 'snippet.txt';
  if (TERMINAL_LANGUAGES.has(normalized)) return null;

  if (normalized === 'yaml') {
    if (/\bspring:\s*$/m.test(codeText) || /\bserver:\s*$/m.test(codeText)) return 'application.yml';
    if (/\bapiVersion:\s*/.test(codeText) && /\bkind:\s*Deployment\b/.test(codeText)) return 'deployment.yaml';
    if (/\bapiVersion:\s*/.test(codeText) && /\bkind:\s*Service\b/.test(codeText)) return 'service.yaml';
    return 'config.yml';
  }

  if (normalized === 'properties') {
    if (/\bspring\./.test(codeText) || /\bserver\./.test(codeText)) return 'application.properties';
    return 'config.properties';
  }

  if (normalized === 'xml') {
    if (/<project[\s>]/.test(codeText)) return 'pom.xml';
    if (/<databaseChangeLog[\s>]/.test(codeText)) return 'changelog.xml';
    return 'config.xml';
  }

  if (normalized === 'groovy') {
    if (/\bplugins\s*\{|\bdependencies\s*\{/.test(codeText)) return 'build.gradle';
    return 'script.groovy';
  }

  if (normalized === 'graphql') {
    if (/\btype\s+Query\b|\btype\s+Mutation\b|\bscalar\b/.test(codeText)) return 'schema.graphqls';
    return 'query.graphql';
  }

  if (normalized === 'java') return inferClassFileName(codeText, 'java') ?? 'Application.java';
  if (normalized === 'kotlin') return inferClassFileName(codeText, 'kt') ?? 'Application.kt';
  if (normalized === 'go') return /\bfunc\s+main\s*\(/.test(codeText) ? 'main.go' : 'app.go';
  if (normalized === 'json') return 'config.json';
  if (normalized === 'csv') return 'data.csv';
  if (normalized === 'sql') return 'schema.sql';
  if (normalized === 'javascript') return 'snippet.js';
  if (normalized === 'typescript') return 'snippet.ts';
  if (normalized === 'python') return 'snippet.py';
  if (normalized === 'c') return 'snippet.c';
  if (normalized === 'cpp') return 'snippet.cpp';
  if (normalized === 'csharp') return 'snippet.cs';

  return /^[a-z0-9_-]+$/i.test(normalized) ? `snippet.${normalized}` : 'snippet.txt';
};

const parseFenceHeader = line => {
  const fenceMatch = /^(\s*)(`{3,}|~{3,})(.*)$/.exec(line);
  if (!fenceMatch) return null;
  const indent = fenceMatch[1];
  const marker = fenceMatch[2];
  const tail = fenceMatch[3].trim();

  if (!tail) {
    return { indent, marker, language: '', meta: '' };
  }

  const [firstToken, ...restTokens] = tail.split(/\s+/);
  if (firstToken.includes('=')) {
    return { indent, marker, language: '', meta: tail };
  }

  return {
    indent,
    marker,
    language: firstToken,
    meta: restTokens.join(' ').trim(),
  };
};

const findFenceEnd = (lines, startIndex, marker) => {
  const markerChar = marker[0];
  const minLength = marker.length;
  const closeRe = new RegExp(`^\\s*${markerChar}{${minLength},}\\s*$`);
  for (let i = startIndex + 1; i < lines.length; i += 1) {
    if (closeRe.test(lines[i])) return i;
  }
  return -1;
};

const rewriteFile = async filePath => {
  const raw = await fs.readFile(filePath, 'utf8');
  const lines = raw.split(/\r?\n/);
  let changed = false;

  for (let i = 0; i < lines.length; i += 1) {
    const header = parseFenceHeader(lines[i]);
    if (!header) continue;

    const end = findFenceEnd(lines, i, header.marker);
    if (end === -1) continue;

    const normalizedLang = normalizeLang(header.language);
    const codeText = lines.slice(i + 1, end).join('\n');

    if (TERMINAL_LANGUAGES.has(normalizedLang)) {
      i = end;
      continue;
    }

    if (hasFilenameMeta(header.meta)) {
      i = end;
      continue;
    }

    const fromHeading = findNearestHeadingFileName(lines, i);
    const inferred = fromHeading ?? inferFallbackFileName(normalizedLang, codeText);
    if (!inferred) {
      i = end;
      continue;
    }

    const nextMeta = header.meta ? `${header.meta} filename="${inferred}"` : `filename="${inferred}"`;
    const info = [header.language, nextMeta].filter(Boolean).join(' ').trim();
    lines[i] = `${header.indent}${header.marker}${info ? ` ${info}` : ''}`;
    changed = true;
    i = end;
  }

  if (changed) {
    await fs.writeFile(filePath, `${lines.join('\n')}\n`, 'utf8');
  }

  return changed;
};

const main = async () => {
  const touched = [];

  for (const locale of LOCALES) {
    const localeDir = path.join(POSTS_ROOT, locale);
    const entries = await fs.readdir(localeDir);
    const markdownFiles = entries.filter(name => name.endsWith('.md')).map(name => path.join(localeDir, name));

    for (const filePath of markdownFiles) {
      const changed = await rewriteFile(filePath);
      if (changed) touched.push(path.relative(ROOT, filePath));
    }
  }

  console.log(`OK: updated ${touched.length} files.`);
  for (const file of touched) {
    console.log(`- ${file}`);
  }
};

main().catch(err => {
  console.error(err);
  process.exit(1);
});
