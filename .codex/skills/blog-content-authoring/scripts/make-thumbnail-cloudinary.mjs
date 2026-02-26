import crypto from 'node:crypto';
import fs from 'node:fs';
import fsp from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import { spawnSync } from 'node:child_process';

const parseArgs = argv => {
  const args = {
    in: null,
    out: null,
    cloudName: process.env.CLOUDINARY_CLOUD_NAME ?? null,
    apiKey: process.env.CLOUDINARY_API_KEY ?? null,
    apiSecret: process.env.CLOUDINARY_API_SECRET ?? null,
    uploadPreset: process.env.CLOUDINARY_UPLOAD_PRESET ?? null,
    signature: null,
    timestamp: null,
    publicId: null,
    folder: null,
    assetFolder: null,
    width: 1200,
    height: 630,
    crop: 'fill',
    format: 'webp',
    quality: 'auto',
    resourceType: 'image',
    overwrite: true,
    invalidate: true,
    source: null,
    skipDownload: false,
    printJson: false,
  };

  const toCamel = key => key.replace(/^--/, '').replace(/-([a-z])/g, (_, c) => c.toUpperCase());

  for (let i = 2; i < argv.length; i += 1) {
    const token = argv[i];
    if (token === '--help' || token === '-h') {
      args.help = true;
      continue;
    }
    if (!token.startsWith('--')) continue;

    if (token === '--skip-download') {
      args.skipDownload = true;
      continue;
    }
    if (token === '--print-json') {
      args.printJson = true;
      continue;
    }
    if (token === '--no-overwrite') {
      args.overwrite = false;
      continue;
    }
    if (token === '--no-invalidate') {
      args.invalidate = false;
      continue;
    }

    const key = toCamel(token);
    const value = argv[i + 1];
    if (value == null || value.startsWith('--')) {
      console.error(`Missing value for ${token}`);
      process.exit(2);
    }
    args[key] = value;
    i += 1;
  }

  args.width = Number(args.width);
  args.height = Number(args.height);
  if (args.timestamp != null) args.timestamp = Number(args.timestamp);

  return args;
};

const usage = () => {
  console.log(
    [
      'Usage:',
      '  node .codex/skills/blog-content-authoring/scripts/make-thumbnail-cloudinary.mjs \\',
      '    --in <local-file-or-remote-image-url> \\',
      '    --out public/images/<slug>-thumbnail.webp \\',
      '    --cloud-name <cloud_name> \\',
      '    --upload-preset <preset> \\',
      '    [--api-key <key> --api-secret <secret>]',
      '',
      'Modes:',
      '  1) Unsigned preset: provide --upload-preset only (preset must allow unsigned uploads)',
      '  2) Signed upload: provide --api-key and --api-secret (script generates signature)',
      '  3) Pre-signed: provide --api-key --timestamp --signature (advanced/manual fallback)',
      '',
      'Defaults:',
      '  --width 1200 --height 630 --crop fill --format webp --quality auto',
      '  public_id is derived from --out basename when omitted (without extension)',
      '',
      'Output:',
      '  - Uploads source to Cloudinary',
      '  - Builds transformed delivery URL (1200x630 webp by default)',
      '  - Downloads transformed image to --out (unless --skip-download)',
      '',
      'Env (optional):',
      '  CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET, CLOUDINARY_UPLOAD_PRESET',
    ].join('\n'),
  );
};

const isUrl = value => /^https?:\/\//i.test(value);

const derivePublicIdFromOut = outPath => {
  if (!outPath) return null;
  const parsed = path.parse(outPath);
  const base = parsed.name?.trim();
  if (!base) return null;
  return base.replace(/[^\w./-]+/g, '-');
};

const execCurl = (args, { stdin = null } = {}) => {
  const result = spawnSync('curl', args, {
    encoding: 'utf8',
    input: stdin,
    maxBuffer: 10 * 1024 * 1024,
  });
  if (result.status !== 0) {
    const stderr = result.stderr?.trim();
    throw new Error(stderr || `curl failed with exit code ${result.status}`);
  }
  return result.stdout;
};

const buildSignature = ({ apiSecret, signedParams }) => {
  const filtered = Object.entries(signedParams)
    .filter(([, v]) => v != null && v !== '')
    .map(([k, v]) => [k, String(v)]);

  const toSign = filtered
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([k, v]) => `${k}=${v}`)
    .join('&');

  const signature = crypto.createHash('sha1').update(`${toSign}${apiSecret}`).digest('hex');
  return { signature, stringToSign: toSign };
};

const buildTransformSegment = ({ width, height, crop, format, quality }) => {
  const parts = [`w_${width}`, `h_${height}`, `c_${crop}`];
  if (format) parts.push(`f_${format}`);
  if (quality) parts.push(`q_${quality}`);
  return parts.join(',');
};

const assertArgs = args => {
  if (!args.in) {
    console.error('Missing required --in');
    usage();
    process.exit(2);
  }

  if (!args.cloudName) {
    console.error('Missing cloud name. Use --cloud-name or CLOUDINARY_CLOUD_NAME.');
    process.exit(2);
  }

  if (!Number.isFinite(args.width) || args.width <= 0) {
    console.error('Invalid --width');
    process.exit(2);
  }
  if (!Number.isFinite(args.height) || args.height <= 0) {
    console.error('Invalid --height');
    process.exit(2);
  }

  const hasApiKey = Boolean(args.apiKey);
  const hasApiSecret = Boolean(args.apiSecret);
  const hasPreset = Boolean(args.uploadPreset);
  const hasPreSigned = Boolean(args.signature && args.timestamp && args.apiKey);

  if (hasApiSecret && !hasApiKey) {
    console.error('Signed uploads require both --api-key and --api-secret.');
    process.exit(2);
  }

  if (!hasPreset && !hasPreSigned && !(hasApiKey && hasApiSecret)) {
    console.error(
      'Provide either --upload-preset (unsigned), --api-key/--api-secret (signed), or --api-key/--timestamp/--signature (pre-signed).',
    );
    process.exit(2);
  }
};

const uploadToCloudinary = async args => {
  const endpoint = `https://api.cloudinary.com/v1_1/${args.cloudName}/${args.resourceType}/upload`;
  const formArgs = ['-sS', endpoint, '-X', 'POST'];

  const signedParams = {};
  let signature = args.signature;
  let timestamp = args.timestamp;

  if (!signature && args.apiKey && args.apiSecret) {
    timestamp = Number.isFinite(timestamp) ? timestamp : Math.floor(Date.now() / 1000);
    signedParams.timestamp = timestamp;
    if (args.uploadPreset) signedParams.upload_preset = args.uploadPreset;
    if (args.publicId) signedParams.public_id = args.publicId;
    if (args.folder) signedParams.folder = args.folder;
    if (args.assetFolder) signedParams.asset_folder = args.assetFolder;
    if (args.overwrite) signedParams.overwrite = 'true';
    if (args.invalidate) signedParams.invalidate = 'true';
    if (args.source) signedParams.source = args.source;

    const signed = buildSignature({ apiSecret: args.apiSecret, signedParams });
    signature = signed.signature;
    console.log(`Cloudinary string_to_sign: ${signed.stringToSign}`);
  }

  const addField = (key, value) => {
    if (value == null || value === '') return;
    formArgs.push('-F', `${key}=${value}`);
  };

  if (isUrl(args.in)) {
    addField('file', args.in);
  } else {
    const inputPath = path.resolve(args.in);
    if (!fs.existsSync(inputPath)) {
      throw new Error(`Input file not found: ${inputPath}`);
    }
    formArgs.push('-F', `file=@${inputPath}`);
  }

  addField('upload_preset', args.uploadPreset);
  addField('public_id', args.publicId);
  addField('folder', args.folder);
  addField('asset_folder', args.assetFolder);
  addField('overwrite', args.overwrite ? 'true' : 'false');
  addField('invalidate', args.invalidate ? 'true' : 'false');
  addField('source', args.source);

  if (signature) {
    addField('signature', signature);
    addField('timestamp', String(timestamp));
    addField('api_key', args.apiKey);
  } else if (args.timestamp || args.apiKey) {
    addField('timestamp', args.timestamp != null ? String(args.timestamp) : null);
    addField('api_key', args.apiKey);
  }

  const raw = execCurl(formArgs);
  let json;
  try {
    json = JSON.parse(raw);
  } catch {
    throw new Error(`Cloudinary upload response is not JSON:\n${raw}`);
  }
  if (json.error?.message) {
    throw new Error(`Cloudinary upload error: ${json.error.message}`);
  }
  return json;
};

const downloadFile = async ({ url, outPath }) => {
  const absOut = path.resolve(outPath);
  await fsp.mkdir(path.dirname(absOut), { recursive: true });
  execCurl(['-sSL', url, '-o', absOut]);
  const stat = await fsp.stat(absOut);
  return { absOut, bytes: stat.size };
};

const main = async () => {
  const args = parseArgs(process.argv);
  if (args.help) {
    usage();
    return;
  }

  assertArgs(args);

  if (!args.publicId) {
    args.publicId = derivePublicIdFromOut(args.out);
  }

  const upload = await uploadToCloudinary(args);
  const publicId = upload.public_id;
  const transform = buildTransformSegment(args);
  const versionPrefix = upload.version ? `v${upload.version}/` : '';
  const deliveryUrl = `https://res.cloudinary.com/${args.cloudName}/${args.resourceType}/upload/${transform}/${versionPrefix}${publicId}`;

  let fileInfo = null;
  if (!args.skipDownload) {
    if (!args.out) {
      throw new Error('Missing --out (or use --skip-download to only print the URL).');
    }
    fileInfo = await downloadFile({ url: deliveryUrl, outPath: args.out });
  }

  if (args.printJson) {
    console.log(
      JSON.stringify(
        {
          cloudinary: {
            assetId: upload.asset_id,
            publicId,
            version: upload.version,
            secureUrl: upload.secure_url,
          },
          transformed: {
            url: deliveryUrl,
            width: args.width,
            height: args.height,
            format: args.format,
            crop: args.crop,
            quality: args.quality,
          },
          file: fileInfo,
        },
        null,
        2,
      ),
    );
  } else {
    console.log(`Uploaded: ${upload.secure_url}`);
    console.log(`Transformed URL: ${deliveryUrl}`);
    if (fileInfo) {
      console.log(`Saved: ${fileInfo.absOut} (${fileInfo.bytes} bytes)`);
    }
  }
};

main().catch(err => {
  console.error(err.message || err);
  process.exit(1);
});
