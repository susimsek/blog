import fs from 'node:fs/promises';
import path from 'node:path';

const ROOT = process.cwd();

const LOCALES = ['en', 'tr'];

const TOPIC_POOL = ['java', 'kotlin', 'spring-boot', 'kubernetes', 'go'];

const readJson = async filePath => JSON.parse(await fs.readFile(filePath, 'utf8'));

const parseArgs = argv => {
  const out = { seed: 'default' };
  for (const raw of argv.slice(2)) {
    if (raw === '--help' || raw === '-h') out.help = true;
    else if (raw.startsWith('--seed=')) out.seed = raw.slice('--seed='.length);
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

const pick = (rand, arr) => arr[Math.floor(rand() * arr.length)];

const IDEAS = {
  java: [
    {
      id: 'java-virtual-threads-basics',
      title: { en: 'Java Virtual Threads in Practice', tr: 'Java Virtual Thread Pratiği' },
      summary: {
        en: 'Learn when virtual threads help, how to configure them, and how to benchmark blocking workloads safely.',
        tr: 'Virtual thread ne zaman işe yarar, nasıl yapılandırılır ve blocking iş yükleri nasıl ölçümlenir öğrenin.',
      },
      outline: [
        { en: '## 🌟 Why Virtual Threads?', tr: '## 🌟 Neden Virtual Thread?' },
        { en: '## 📋 Prerequisites', tr: '## 📋 Gereksinimler' },
        { en: '## 🛠️ Step 1: Enable virtual threads', tr: '## 🛠️ Adım 1: Virtual thread’i etkinleştirin' },
        { en: '## 🧪 Step 2: Benchmark a blocking endpoint', tr: '## 🧪 Adım 2: Blocking endpoint ölçümü' },
        { en: '## ▶️ Step 3: Run and observe', tr: '## ▶️ Adım 3: Çalıştırın ve gözlemleyin' },
        { en: '---\n\n## 🏁 Conclusion', tr: '---\n\n## 🏁 Sonuç' },
      ],
    },
    {
      id: 'java-records-validation',
      title: { en: 'Validation with Java Records', tr: 'Java Record ile Doğrulama' },
      summary: {
        en: 'Model request DTOs with records, validate with Bean Validation, and keep controller logic clean.',
        tr: 'Request DTO’ları record ile modelleyin, Bean Validation ile doğrulayın ve controller’ı sade tutun.',
      },
      outline: [
        { en: '## 🌟 Why Records for DTOs?', tr: '## 🌟 DTO için Neden Record?' },
        { en: '## 📋 Prerequisites', tr: '## 📋 Gereksinimler' },
        { en: '## 🛠️ Step 1: Define a record DTO', tr: '## 🛠️ Adım 1: Record DTO tanımlayın' },
        { en: '## 🛠️ Step 2: Add validation annotations', tr: '## 🛠️ Adım 2: Doğrulama anotasyonları ekleyin' },
        { en: '## 🧪 Step 3: Test invalid payloads', tr: '## 🧪 Adım 3: Hatalı payload’ları test edin' },
        { en: '---\n\n## 🏁 Conclusion', tr: '---\n\n## 🏁 Sonuç' },
      ],
    },
  ],
  kotlin: [
    {
      id: 'kotlin-coroutines-spring',
      title: { en: 'Kotlin Coroutines with Spring Boot', tr: 'Spring Boot ile Kotlin Coroutines' },
      summary: {
        en: 'Use suspend controllers safely, understand thread usage, and test coroutine-based flows.',
        tr: 'Suspend controller kullanımını, thread davranışını ve coroutine akışlarını test etmeyi öğrenin.',
      },
      outline: [
        { en: '## 🌟 When Coroutines Help', tr: '## 🌟 Coroutines Ne Zaman Faydalı' },
        { en: '## 📋 Prerequisites', tr: '## 📋 Gereksinimler' },
        { en: '## 🛠️ Step 1: Add coroutine dependencies', tr: '## 🛠️ Adım 1: Coroutine bağımlılıklarını ekleyin' },
        { en: '## 🛠️ Step 2: Build a suspend endpoint', tr: '## 🛠️ Adım 2: Suspend endpoint yazın' },
        { en: '## 🧪 Step 3: Test with MockMvc/WebTestClient', tr: '## 🧪 Adım 3: Test edin' },
        { en: '---\n\n## 🏁 Conclusion', tr: '---\n\n## 🏁 Sonuç' },
      ],
    },
  ],
  'spring-boot': [
    {
      id: 'spring-boot-observability',
      title: { en: 'Spring Boot Observability Basics', tr: 'Spring Boot Observability Temelleri' },
      summary: {
        en: 'Add metrics, traces, and logs with a clean setup and learn how to validate the output locally.',
        tr: 'Metrik, trace ve log kurulumunu temiz bir şekilde ekleyin ve çıktıyı lokal doğrulayın.',
      },
      outline: [
        { en: '## 🌟 What You Get', tr: '## 🌟 Ne Kazanırsınız' },
        { en: '## 📋 Prerequisites', tr: '## 📋 Gereksinimler' },
        { en: '## 🛠️ Step 1: Enable Actuator endpoints', tr: '## 🛠️ Adım 1: Actuator endpoint’lerini açın' },
        { en: '## 🛠️ Step 2: Add tracing', tr: '## 🛠️ Adım 2: Tracing ekleyin' },
        { en: '## 🧪 Step 3: Verify metrics and traces', tr: '## 🧪 Adım 3: Doğrulayın' },
        { en: '---\n\n## 🏁 Conclusion', tr: '---\n\n## 🏁 Sonuç' },
      ],
    },
  ],
  kubernetes: [
    {
      id: 'kubernetes-health-probes',
      title: { en: 'Kubernetes Health Probes for Spring Boot', tr: 'Spring Boot için Kubernetes Health Probe’ları' },
      summary: {
        en: 'Wire readiness/liveness probes correctly, avoid common pitfalls, and validate with port-forward.',
        tr: 'Readiness/liveness probe’ları doğru bağlayın, sık hatalardan kaçının ve port-forward ile doğrulayın.',
      },
      outline: [
        { en: '## 🌟 Why Probes Matter', tr: '## 🌟 Probe’lar Neden Önemli' },
        { en: '## 📋 Prerequisites', tr: '## 📋 Gereksinimler' },
        { en: '## 🛠️ Step 1: Expose health endpoints', tr: '## 🛠️ Adım 1: Health endpoint’lerini açın' },
        { en: '## 🛠️ Step 2: Add probe YAML', tr: '## 🛠️ Adım 2: Probe YAML ekleyin' },
        { en: '## 🧪 Step 3: Validate behavior', tr: '## 🧪 Adım 3: Davranışı doğrulayın' },
        { en: '---\n\n## 🏁 Conclusion', tr: '---\n\n## 🏁 Sonuç' },
      ],
    },
  ],
  go: [
    {
      id: 'go-http-timeouts',
      title: { en: 'Go HTTP Timeouts Done Right', tr: 'Go HTTP Timeout Doğru Kullanımı' },
      summary: {
        en: 'Configure server and client timeouts, propagate context, and avoid goroutine leaks.',
        tr: 'Server/client timeout yapılandırın, context’i taşıyın ve goroutine leak’lerinden kaçının.',
      },
      outline: [
        { en: '## 🌟 Common Timeout Pitfalls', tr: '## 🌟 Yaygın Timeout Hataları' },
        { en: '## 📋 Prerequisites', tr: '## 📋 Gereksinimler' },
        { en: '## 🛠️ Step 1: Set server timeouts', tr: '## 🛠️ Adım 1: Server timeout ayarlayın' },
        { en: '## 🛠️ Step 2: Set client timeouts', tr: '## 🛠️ Adım 2: Client timeout ayarlayın' },
        { en: '## 🧪 Step 3: Test cancellation', tr: '## 🧪 Adım 3: İptali test edin' },
        { en: '---\n\n## 🏁 Conclusion', tr: '---\n\n## 🏁 Sonuç' },
      ],
    },
  ],
};

const slugify = s =>
  s
    .toLowerCase()
    .replace(/['’]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
    .slice(0, 80);

const loadTopics = async () => {
  const byLocale = new Map();
  for (const locale of LOCALES) {
    const topicsPath = path.join(ROOT, 'public', 'data', `topics.${locale}.json`);
    const topics = await readJson(topicsPath);
    byLocale.set(locale, new Map(topics.map(t => [t.id, t])));
  }
  return byLocale;
};

const main = async () => {
  const args = parseArgs(process.argv);
  if (args.help) {
    process.stdout.write(
      [
        'Usage:',
        '  node .codex/skills/blog-content-authoring/scripts/suggest-random-post.mjs [--seed=STRING]',
        '',
        'Output:',
        '  Prints a JSON payload with a random post idea constrained to: Java/Kotlin/Spring Boot/Kubernetes/Go.',
      ].join('\n') + '\n',
    );
    return;
  }

  const topics = await loadTopics();
  const rand = mulberry32(xmur3(args.seed)());

  const primary = pick(rand, TOPIC_POOL);
  const idea = pick(rand, IDEAS[primary]);

  const slug = slugify(idea.id);
  const date = new Date().toISOString().slice(0, 10);

  const topicIds = new Set([primary, 'programming']);
  if (primary === 'spring-boot') topicIds.add('java');
  if (primary === 'kubernetes') topicIds.add('spring-boot');

  const toTopicEntries = locale =>
    [...topicIds]
      .map(id => topics.get(locale)?.get(id))
      .filter(Boolean)
      .map(t => ({ id: t.id, name: t.name, color: t.color }));

  const payload = {
    slug,
    date,
    titles: idea.title,
    summaries: idea.summary,
    topics: {
      en: toTopicEntries('en'),
      tr: toTopicEntries('tr'),
    },
    outline: {
      en: idea.outline.map(x => x.en),
      tr: idea.outline.map(x => x.tr),
    },
    notes: [
      'Keep the post title clean (avoid parentheses).',
      'Follow the repo standards: Prerequisites/Steps/Conclusion emojis and a single Conclusion section.',
      'Add the post to both post index files (public/data/posts.en.json and public/data/posts.tr.json) and create a 1200x630 WebP thumbnail under public/images.',
      'Use the Iram theme variants when generating the thumbnail.',
    ],
  };

  process.stdout.write(`${JSON.stringify(payload, null, 2)}\n`);
};

main().catch(err => {
  console.error(err);
  process.exit(1);
});
