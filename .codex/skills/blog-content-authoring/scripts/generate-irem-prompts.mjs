import fs from 'node:fs/promises';
import path from 'node:path';

const ROOT = process.cwd();

const LOCALES = ['en', 'tr'];

// Allow piping into tools like `head` without crashing on EPIPE.
process.stdout.on('error', err => {
  if (err?.code === 'EPIPE') {
    process.exit(0);
  }
});

const readJson = async filePath => JSON.parse(await fs.readFile(filePath, 'utf8'));

const topicNamesByLocale = async () => {
  const out = new Map();
  for (const locale of LOCALES) {
    const topicsPath = path.join(ROOT, 'content', 'topics', locale, 'topics.json');
    const topics = await readJson(topicsPath);
    out.set(
      locale,
      new Map(
        topics.map(t => [
          t.id,
          {
            name: t.name,
            color: t.color,
          },
        ]),
      ),
    );
  }
  return out;
};

const motifByTopicId = {
  'spring-boot': 'emerald-gold aura, lush oasis greenery woven into stone terraces',
  'spring-security': 'golden sigils, sealed gates, protective runes carved in basalt',
  security: 'golden sigils, sealed gates, protective runes carved in basalt',
  jwt: 'floating token glyphs, encrypted patterns, subtle hex motifs',
  jwe: 'glowing cipher veil, translucent crystal lattice, encrypted filigree',
  graphql: 'geometric network of luminous lines, constellation-like nodes',
  openapi: 'blueprint scrolls, technical diagram motifs etched in stone',
  docker: 'ancient crates and arches, subtle container silhouettes, brass rivets',
  kubernetes: 'hexagonal tessellation, orchestration rings, sacred geometry',
  kafka: 'glowing message streams flowing between pillars, rhythmic wave patterns',
  redis: 'crimson cache embers, stacked memory stones, quick spark trails',
  caching: 'timeworn vaults, repeating memory motifs, circular cache glyphs',
  validation: 'ceremonial checkmarks in stone, constraint runes, precise symmetry',
  aop: 'layered translucent planes, intersecting arcs, cross-cutting light beams',
  'dependency-injection': 'interlocking conduits, braided energy channels, seamless joins',
  devtools: 'artisan tools, subtle gears, illuminated workbench glow',
  monitoring: 'watchtowers, observatory lenses, aurora-like telemetry lines',
  actuator: 'control valves, gauges, dashboard-like runes, instrument panels',
  graalvm: 'obsidian monoliths, molten gold inlays, phoenix-like heat haze',
  'native-image': 'carved stone reliefs coming alive, sharp edges, chiseled highlights',
  orm: 'marble tables, relational grid inlaid on floors, mirrored pools',
  'rest-api': 'gateway arches, request/response streams, clean directional flow',
  programming: 'ancient codex tablets, etched code patterns, glowing script',
  testing: 'ritual trial chamber, calibrated light, verification seals',
  configuration: 'inscribed configuration tablets, nested glyph panels, orderly columns',
};

const baseStyle = [
  'Iram of the Pillars (Irem Şehri), ancient Arab myth-inspired lost city',
  'majestic and mysterious sacred place, timeless, uninhabited (no people)',
  'endless columns and towering palaces, monumental architecture',
  'terraced gardens integrated with nature, clear water channels, reflective pools',
  'golden hour light beams, volumetric light, atmospheric haze, epic cinematic mood',
  'fantastical realism, ultra-detailed, wide-angle, high dynamic range',
].join(', ');

const negative = [
  'people',
  'faces',
  'crowds',
  'text',
  'logos',
  'watermark',
  'lowres',
  'blurry',
  'noise',
  'oversaturated',
  'cartoon',
  'anime',
  'nsfw',
].join(', ');

const buildPrompt = (title, topicIds) => {
  const motifs = topicIds
    .map(id => motifByTopicId[id])
    .filter(Boolean)
    .slice(0, 4);

  const subject = `Scene subtly themed for: ${title}`;
  const motif = motifs.length ? `Thematic motifs: ${motifs.join('; ')}` : null;

  return [baseStyle, subject, motif].filter(Boolean).join('. ');
};

const main = async () => {
  const topicsMap = await topicNamesByLocale();

  const postsEn = await readJson(path.join(ROOT, 'content', 'posts', 'en', 'posts.json'));
  const postsTr = await readJson(path.join(ROOT, 'content', 'posts', 'tr', 'posts.json'));
  const trById = new Map(postsTr.map(p => [p.id, p]));

  // Output JSONL to stdout: one line per post.
  for (const post of postsEn) {
    const tr = trById.get(post.id);
    const topicIds = (post.topics ?? []).map(t => t.id).filter(Boolean);

    const payload = {
      id: post.id,
      thumbnailPath: post.thumbnail,
      titles: {
        en: post.title,
        tr: tr?.title ?? null,
      },
      topics: {
        en: topicIds.map(id => ({ id, ...(topicsMap.get('en')?.get(id) ?? {}) })),
        tr: topicIds.map(id => ({ id, ...(topicsMap.get('tr')?.get(id) ?? {}) })),
      },
      prompt: {
        en: buildPrompt(post.title, topicIds),
        tr: tr?.title ? buildPrompt(tr.title, topicIds) : buildPrompt(post.title, topicIds),
      },
      negative,
      recommended: {
        size: '1200x630',
        format: 'webp',
        notes: [
          'Keep composition centered with strong leading lines (pillars/arches).',
          'Avoid any readable text in the image.',
          'Deliver the final as a clean image; convert to 1200x630 WebP for the blog thumbnail.',
        ],
      },
    };

    process.stdout.write(`${JSON.stringify(payload)}\n`);
  }
};

main().catch(err => {
  console.error(err);
  process.exit(1);
});
