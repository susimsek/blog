const fs = require('node:fs');
const path = require('node:path');

const { locales } = require('../i18n.config.json');

const sourceRoot = path.join(process.cwd(), 'content', 'posts');
const targetRoot = path.join(process.cwd(), 'build', 'search');

const copyPostsIndex = locale => {
  const sourceFile = path.join(sourceRoot, locale, 'posts.json');
  const targetFile = path.join(targetRoot, `posts.${locale}.json`);

  if (!fs.existsSync(sourceFile)) {
    console.warn(`posts.json not found for locale "${locale}" at ${sourceFile}`);
    return;
  }

  fs.mkdirSync(targetRoot, { recursive: true });
  fs.copyFileSync(sourceFile, targetFile);
  console.log(`Copied posts index for locale "${locale}" to: ${targetFile}`);
};

locales.forEach(copyPostsIndex);
