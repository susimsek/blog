import fs from 'node:fs/promises';
import path from 'node:path';

const ROOT = process.cwd();

// Allow piping into tools like `head` without crashing on EPIPE.
process.stdout.on('error', err => {
  if (err?.code === 'EPIPE') {
    process.exit(0);
  }
});

const readJson = async filePath => JSON.parse(await fs.readFile(filePath, 'utf8'));

const parseArgs = argv => {
  const out = { help: false };
  for (const raw of argv.slice(2)) {
    if (raw === '--help' || raw === '-h') out.help = true;
  }
  return out;
};

const baseStyle = {
  en: [
    'Iram of the Pillars (Irem Sehri), ancient Arab myth-inspired lost city',
    'majestic and mysterious sacred place, timeless, uninhabited (no people)',
    'endless columns and towering palaces, monumental architecture',
    'terraced gardens integrated with nature, clear water channels, reflective pools',
    'golden hour light beams, volumetric light, atmospheric haze, epic cinematic mood',
    'fantastical realism, ultra-detailed, wide-angle, high dynamic range',
  ].join(', '),
  tr: [
    'Sutunlarin Sehri Irem (Iram of the Pillars), Arap mitlerinden ilham alan kayip kadim sehir',
    'gorkemli ve gizemli kutsal mekan, zamansiz, issiz (insan yok)',
    'sonsuz sutunlar ve yukselen saraylar, anitsal mimari',
    'dogayla butunlesen terasli bahceler, berrak su kanallari, yansitici havuzlar',
    'altin saat isik huzmeleri, volumetrik isik, atmosferik pus, epik sinematik hava',
    'fantastik realizm, ultra detay, genis aci, yuksek dinamik aralik',
  ].join(', '),
};

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

const main = async () => {
  const args = parseArgs(process.argv);
  if (args.help) {
    process.stdout.write(
      [
        'Usage:',
        '  node .codex/skills/blog-content-authoring/scripts/generate-thumbnail-prompts.mjs',
        '',
        'Notes:',
        '  Generates one JSONL line per post with a single Irem-themed prompt.',
        '  Topic-based motifs and variant themes are intentionally disabled.',
      ].join('\n') + '\n',
    );
    return;
  }

  const postsEn = await readJson(path.join(ROOT, 'content', 'posts', 'en', 'posts.json'));
  const postsTr = await readJson(path.join(ROOT, 'content', 'posts', 'tr', 'posts.json'));
  const trById = new Map(postsTr.map(p => [p.id, p]));

  // Output JSONL to stdout: one line per post.
  for (const post of postsEn) {
    const tr = trById.get(post.id);

    const payload = {
      id: post.id,
      thumbnailPath: post.thumbnail,
      titles: {
        en: post.title,
        tr: tr?.title ?? null,
      },
      prompt: {
        en: baseStyle.en,
        tr: baseStyle.tr,
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
