import fs from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import sharp from 'sharp';

const parseArgs = argv => {
  const args = { in: null, out: null, maxWidth: 1200, quality: 82 };
  for (let i = 2; i < argv.length; i += 1) {
    const key = argv[i];
    const value = argv[i + 1];
    if (!key?.startsWith('--')) continue;
    if (key === '--in') args.in = value;
    if (key === '--out') args.out = value;
    if (key === '--maxWidth') args.maxWidth = Number(value);
    if (key === '--quality') args.quality = Number(value);
  }
  return args;
};

const usage = () => {
  console.log(
    [
      'Usage:',
      '  node .codex/skills/blog-content-authoring/scripts/make-post-image.mjs --in <source> --out public/images/posts/<slug>/<name>.webp',
      '',
      'Options:',
      '  --maxWidth <number>  Max width in px (default: 1200)',
      '  --quality <number>   WebP quality (default: 82)',
    ].join('\n'),
  );
};

const main = async () => {
  const args = parseArgs(process.argv);
  if (!args.in || !args.out) {
    usage();
    process.exit(2);
  }

  if (!Number.isFinite(args.maxWidth) || args.maxWidth < 200 || args.maxWidth > 4000) {
    console.error('Invalid --maxWidth. Use a number between 200 and 4000.');
    process.exit(2);
  }

  if (!Number.isFinite(args.quality) || args.quality < 1 || args.quality > 100) {
    console.error('Invalid --quality. Use a number between 1 and 100.');
    process.exit(2);
  }

  const inputPath = path.resolve(args.in);
  const outputPath = path.resolve(args.out);
  await fs.mkdir(path.dirname(outputPath), { recursive: true });

  const pipeline = sharp(inputPath).resize({
    width: args.maxWidth,
    withoutEnlargement: true,
    fit: 'inside',
  });

  await pipeline.webp({ quality: args.quality }).toFile(outputPath);

  const meta = await sharp(outputPath).metadata();
  console.log(`OK: ${outputPath}`);
  if (meta.width && meta.height) {
    console.log(`size: ${meta.width}x${meta.height}`);
  }
};

main().catch(err => {
  console.error(err);
  process.exit(1);
});
