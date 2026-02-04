import fs from 'node:fs/promises';
import path from 'node:path';

const ROOT = process.cwd();

const LOCALES = ['en', 'tr'];

const THEMES = [
  {
    id: 'lost-beneath-sands',
    label: { en: 'Iram Lost Beneath the Sands', tr: 'Kumlar Altında Kayıp İrem' },
    prompt: {
      en: 'half-buried palaces and columns emerging from desert dunes, wind-carved stone, fine dust in the air, warm sand palette',
      tr: 'çöl kum tepeleri altında yarı gömülü saraylar ve sütunlar, rüzgârın oyduğu taş, havada ince toz, sıcak kum tonları',
    },
  },
  {
    id: 'frozen-under-ice',
    label: { en: 'Iram Frozen Under Ice', tr: 'Buzlar Altında Donmuş İrem' },
    prompt: {
      en: 'ancient city sealed in translucent ice, frosted columns, crystalline reflections, cold blue light, drifting snow',
      tr: 'yarı saydam buz altında mühürlenmiş kadim şehir, kırağılı sütunlar, kristalimsi yansımalar, soğuk mavi ışık, savrulan kar',
    },
  },
  {
    id: 'swallowed-by-forest',
    label: { en: 'Iram Swallowed by Forests', tr: 'Ormanlar Tarafından Yutulmuş İrem' },
    prompt: {
      en: 'dense forest reclaiming ruins, vines wrapping columns, mossy terraces, shafts of light through canopy, humid mist',
      tr: 'yoğun ormanın harabeleri geri alması, sütunlara dolanan sarmaşıklar, yosunlu teraslar, ağaç gölgeliğinde ışık huzmeleri, nemli sis',
    },
  },
  {
    id: 'hidden-in-mountain-valleys',
    label: { en: 'Iram Hidden in Mountain Valleys', tr: 'Dağ Vadilerinde Gizli İrem' },
    prompt: {
      en: 'monumental city tucked between steep valley walls, waterfall-fed channels, dramatic cliffs, thin fog and sun rays',
      tr: 'dik vadi duvarları arasında saklı görkemli şehir, şelale beslemeli su kanalları, dramatik kayalıklar, ince sis ve güneş ışınları',
    },
  },
  {
    id: 'sunken-underwater',
    label: { en: 'Sunken Underwater Iram', tr: 'Sular Altında Batık İrem' },
    prompt: {
      en: 'submerged ruins in clear water, columns fading into the deep, caustic light patterns, floating sand motes, serene silence',
      tr: 'berrak sular altında batık harabeler, derine doğru kaybolan sütunlar, su ışığı desenleri, yüzen kum taneleri, dingin sessizlik',
    },
  },
  {
    id: 'cursed-dark',
    label: { en: 'Cursed Dark Iram', tr: 'Lanetlenmiş Karanlık İrem' },
    prompt: {
      en: 'ominous shadowed city, eclipsed light, faint ember glow in carvings, heavy haze, unsettling sacred atmosphere (no horror gore)',
      tr: 'tekinsiz gölgeli şehir, sönük ışık, oymalarda hafif köz parıltıları, ağır pus, rahatsız edici kutsal atmosfer (kan/gore yok)',
    },
  },
  {
    id: 'moonlit',
    label: { en: 'Moonlit Iram', tr: 'Ay Işığında İrem' },
    prompt: {
      en: 'moonlight bathing endless columns, silver-blue highlights, calm reflective pools, soft mist, starry sky',
      tr: 'ay ışığının aydınlattığı sonsuz sütunlar, gümüş-mavi vurgular, sakin yansıtıcı havuzlar, yumuşak sis, yıldızlı gökyüzü',
    },
  },
  {
    id: 'sunrise',
    label: { en: 'Iram at Sunrise', tr: 'Gün Doğumundaki İrem' },
    prompt: {
      en: 'first golden rays over terraces, warm-to-cool gradient sky, glowing water channels, fresh morning haze',
      tr: 'terasların üzerine düşen ilk altın ışık, sıcak-soğuk geçişli gökyüzü, parlayan su kanalları, taze sabah pususu',
    },
  },
  {
    id: 'sunset',
    label: { en: 'Iram at Sunset', tr: 'Gün Batımındaki İrem' },
    prompt: {
      en: 'deep amber sunset light, long shadows between columns, dramatic sky, reflective pools catching fire-like glow',
      tr: 'derin kehribar gün batımı ışığı, sütunlar arasında uzun gölgeler, dramatik gökyüzü, ateş gibi parlayan yansıtıcı havuzlar',
    },
  },
  {
    id: 'storm',
    label: { en: 'Iram Under the Storm', tr: 'Fırtına Altındaki İrem' },
    prompt: {
      en: 'storm clouds rolling above palaces, rain curtains in the distance, lightning illuminating columns, wind-tossed mist',
      tr: 'sarayların üzerinde ilerleyen fırtına bulutları, uzakta yağmur perdeleri, sütunları aydınlatan şimşekler, rüzgârla savrulan sis',
    },
  },
  {
    id: 'endless-pillars',
    label: { en: 'Iram, City of Endless Pillars', tr: 'Sonsuz Sütunların Şehri İrem' },
    prompt: {
      en: 'hyper-emphasis on infinite colonnades, repeating perspective, strong leading lines, monumental scale, sacred symmetry',
      tr: 'sonsuz kolonadlara güçlü vurgu, tekrar eden perspektif, kuvvetli yönlendiren çizgiler, anıtsal ölçek, kutsal simetri',
    },
  },
  {
    id: 'covered-in-greenery',
    label: { en: 'Iram Covered in Greenery', tr: 'Yeşilliklerle Kaplı İrem' },
    prompt: {
      en: 'lush vegetation draping architecture, green terraces, vines and moss, bright yet cinematic lighting, clear water',
      tr: 'mimarinin üzerine yayılan gür bitki örtüsü, yeşil teraslar, sarmaşık ve yosunlar, parlak ama sinematik ışık, berrak su',
    },
  },
  {
    id: 'flower-valleys',
    label: { en: 'Iram in Flower Valleys', tr: 'Çiçek Vadilerindeki İrem' },
    prompt: {
      en: 'valleys filled with wildflowers around the ruins, colorful yet natural palette, petals on water, golden light',
      tr: 'harabeleri çevreleyen kır çiçekleriyle dolu vadiler, renkli ama doğal palet, su üzerinde yapraklar, altın ışık',
    },
  },
  {
    id: 'between-waterfalls',
    label: { en: 'Iram Between Waterfalls', tr: 'Şelaleler Arasındaki İrem' },
    prompt: {
      en: 'multiple waterfalls framing the city, mist plumes, wet stone reflections, dramatic depth, wide-angle composition',
      tr: 'şehri çerçeveleyen çoklu şelaleler, sis bulutları, ıslak taş yansımaları, dramatik derinlik, geniş açı kompozisyon',
    },
  },
  {
    id: 'rising-over-ruins',
    label: { en: 'Iram Rising Over Ruins', tr: 'Harabeler Üzerinde Yükselen İrem' },
    prompt: {
      en: 'new monumental structures emerging from older ruins, layered history, broken columns beside pristine palaces',
      tr: 'eski harabelerin üzerinden yükselen yeni anıtsal yapılar, katmanlı tarih hissi, kırık sütunların yanında kusursuz saraylar',
    },
  },
  {
    id: 'reborn-with-nature',
    label: { en: 'Iram Reborn With Nature', tr: 'Doğayla Yeniden Doğan İrem' },
    prompt: {
      en: 'restored harmony of stone and nature, rebuilt terraces, water returning to channels, hopeful epic mood',
      tr: 'taş ve doğanın yeniden uyumu, onarılmış teraslar, kanallara geri dönen sular, umutlu epik atmosfer',
    },
  },
  {
    id: 'ancient-sages',
    label: { en: 'Iram of the Ancient Sages', tr: 'Kadim Bilgelerin İrem’i' },
    prompt: {
      en: 'library-like courtyards, carved knowledge tablets, subtle glowing inscriptions (no readable text), contemplative sacred calm',
      tr: 'kütüphane hissi veren avlular, oyulmuş bilgi tabletleri, hafif parlayan yazıtlar (okunur metin yok), dingin kutsal atmosfer',
    },
  },
  {
    id: 'outside-time',
    label: { en: 'Iram Outside of Time', tr: 'Zamanın Dışındaki İrem' },
    prompt: {
      en: 'timeless surreal stillness, soft temporal haze, impossible clean reflections, dreamlike yet realistic detail',
      tr: 'zamansız sürreal dinginlik, yumuşak zaman sisi, imkânsız temiz yansımalar, rüya gibi ama gerçekçi detay',
    },
  },
  {
    id: 'lost-civilization',
    label: { en: 'Iram of a Lost Civilization', tr: 'Kayıp Medeniyet İrem' },
    prompt: {
      en: 'abandoned grandeur, relics of forgotten engineering, broken arches, dust and sun shafts, quiet awe',
      tr: 'terk edilmiş ihtişam, unutulmuş mühendisliğin izleri, kırık kemerler, toz ve güneş huzmeleri, sessiz hayranlık',
    },
  },
  {
    id: 'under-the-stars',
    label: { en: 'Iram Under the Stars', tr: 'Yıldızların Altında İrem' },
    prompt: {
      en: 'clear night sky full of stars, subtle nebula-like haze, moonless dark blues, gentle rim light on columns',
      tr: 'yıldızlarla dolu berrak gece, hafif nebula benzeri pus, ay’sız koyu mavi tonlar, sütunlarda ince kenar ışığı',
    },
  },
  {
    id: 'above-the-clouds',
    label: { en: 'Iram Above the Clouds', tr: 'Bulutlar Üzerinde İrem' },
    prompt: {
      en: 'city rising above a sea of clouds, soft cloudlight, distant peaks, ethereal atmosphere, grand scale',
      tr: 'bulut denizinin üzerinde yükselen şehir, yumuşak bulut ışığı, uzak zirveler, eterik atmosfer, görkemli ölçek',
    },
  },
  {
    id: 'dream-realm',
    label: { en: 'Iram of the Dream Realm', tr: 'Rüyalar Diyarı İrem' },
    prompt: {
      en: 'dreamlike composition with realistic detail, subtle floating dust motes, gentle lens bloom, sacred surreal calm',
      tr: 'gerçekçi detaylarla rüya gibi kompozisyon, havada süzülen ince parçacıklar, yumuşak ışık taşması, kutsal sürreal dinginlik',
    },
  },
  {
    id: 'timeless-legend',
    label: { en: 'Iram, Timeless Legend', tr: 'Zamansız Efsane İrem' },
    prompt: {
      en: 'mythic legendary aura, monumental hero-scale architecture, epic cinematic framing, timeless sacred atmosphere',
      tr: 'mitik efsanevi aura, kahraman ölçeğinde anıtsal mimari, epik sinematik kadraj, zamansız kutsal atmosfer',
    },
  },
];

// Allow piping into tools like `head` without crashing on EPIPE.
process.stdout.on('error', err => {
  if (err?.code === 'EPIPE') {
    process.exit(0);
  }
});

const readJson = async filePath => JSON.parse(await fs.readFile(filePath, 'utf8'));

const parseArgs = argv => {
  const out = { mode: 'by-post-id', seed: 'default' };
  for (const raw of argv.slice(2)) {
    if (raw === '--help' || raw === '-h') out.help = true;
    else if (raw.startsWith('--seed=')) out.seed = raw.slice('--seed='.length);
    else if (raw.startsWith('--mode=')) out.mode = raw.slice('--mode='.length);
  }
  return out;
};

const xmur3 = str => {
  let h = 1779033703 ^ str.length;
  for (let i = 0; i < str.length; i += 1) {
    h = Math.imul(h ^ str.charCodeAt(i), 3432918353);
    h = (h << 13) | (h >>> 19);
  }
  return () => {
    h = Math.imul(h ^ (h >>> 16), 2246822507);
    h = Math.imul(h ^ (h >>> 13), 3266489909);
    h ^= h >>> 16;
    return h >>> 0;
  };
};

const mulberry32 = a => {
  return () => {
    let t = (a += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
};

const pickTheme = ({ mode, seed, postId }) => {
  if (mode === 'random') return THEMES[Math.floor(Math.random() * THEMES.length)];
  const hash = xmur3(`${seed}:${postId}`)();
  const rand = mulberry32(hash)();
  return THEMES[Math.floor(rand * THEMES.length)];
};

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

const buildPrompt = ({ title, topicIds, theme, locale }) => {
  const motifs = topicIds
    .map(id => motifByTopicId[id])
    .filter(Boolean)
    .slice(0, 4);

  const subject = `Scene subtly themed for: ${title}`;
  const motif = motifs.length ? `Thematic motifs: ${motifs.join('; ')}` : null;
  const themeLine =
    theme?.label?.[locale] && theme?.prompt?.[locale]
      ? `Iram variant: ${theme.label[locale]} (${theme.prompt[locale]})`
      : null;

  return [baseStyle, subject, themeLine, motif].filter(Boolean).join('. ');
};

const main = async () => {
  const args = parseArgs(process.argv);
  if (args.help) {
    process.stdout.write(
      [
        'Usage:',
        '  node .codex/skills/blog-content-authoring/scripts/generate-irem-prompts.mjs [--seed=STRING] [--mode=by-post-id|random]',
        '',
        'Notes:',
        '  --mode=by-post-id (default) assigns a deterministic theme per post id.',
        '  --mode=random picks a truly random theme each run.',
      ].join('\n') + '\n',
    );
    return;
  }

  const topicsMap = await topicNamesByLocale();

  const postsEn = await readJson(path.join(ROOT, 'content', 'posts', 'en', 'posts.json'));
  const postsTr = await readJson(path.join(ROOT, 'content', 'posts', 'tr', 'posts.json'));
  const trById = new Map(postsTr.map(p => [p.id, p]));

  // Output JSONL to stdout: one line per post.
  for (const post of postsEn) {
    const tr = trById.get(post.id);
    const topicIds = (post.topics ?? []).map(t => t.id).filter(Boolean);
    const theme = pickTheme({ mode: args.mode, seed: args.seed, postId: post.id });

    const payload = {
      id: post.id,
      thumbnailPath: post.thumbnail,
      theme: {
        id: theme.id,
        label: theme.label,
        prompt: theme.prompt,
      },
      titles: {
        en: post.title,
        tr: tr?.title ?? null,
      },
      topics: {
        en: topicIds.map(id => ({ id, ...(topicsMap.get('en')?.get(id) ?? {}) })),
        tr: topicIds.map(id => ({ id, ...(topicsMap.get('tr')?.get(id) ?? {}) })),
      },
      prompt: {
        en: buildPrompt({ title: post.title, topicIds, theme, locale: 'en' }),
        tr: buildPrompt({ title: tr?.title ?? post.title, topicIds, theme, locale: 'tr' }),
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
