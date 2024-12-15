module.exports = {
  reactStrictMode: true,
  poweredByHeader: false,
  trailingSlash: false,
  distDir: 'build',
  output: 'export',
  basePath: process.env.NEXT_PUBLIC_BASE_PATH,
  assetPrefix: process.env.NEXT_PUBLIC_ASSET_PREFIX,
  images: {
    unoptimized: true,
  },
  webpack: config => {
    // Add rule for SVG files
    config.module.rules.push({
      test: /\.svg$/,
      use: ['@svgr/webpack', 'url-loader'],
    });

    return config;
  },
};
