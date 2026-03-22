import fs from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import sharp from 'sharp';

const parseArgs = argv => {
  const args = { in: null, out: null, quality: 82 };
  for (let i = 2; i < argv.length; i += 1) {
    const key = argv[i];
    const value = argv[i + 1];
    if (!key?.startsWith('--')) continue;
    if (key === '--in') args.in = value;
    if (key === '--out') args.out = value;
    if (key === '--quality') args.quality = Number(value);
  }
  return args;
};

const usage = () => {
  // Keep it short: this is a CLI helper.
  console.log(
    [
      'Usage:',
      '  node skills/blog-content-authoring/scripts/make-thumbnail.mjs --in <source> --out public/images/<slug>-thumbnail.webp',
      '',
      'Options:',
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

  if (!Number.isFinite(args.quality) || args.quality < 1 || args.quality > 100) {
    console.error('Invalid --quality. Use a number between 1 and 100.');
    process.exit(2);
  }

  const inputPath = path.resolve(args.in);
  const outputPath = path.resolve(args.out);
  await fs.mkdir(path.dirname(outputPath), { recursive: true });

  await sharp(inputPath)
    .resize(1200, 630, { fit: 'cover', position: 'attention' })
    .webp({ quality: args.quality })
    .toFile(outputPath);

  console.log(`OK: ${outputPath}`);
};

main().catch(err => {
  console.error(err);
  process.exit(1);
});
