module.exports = {
  poweredByHeader: false,
  distDir: "build",
  output: "export",
  basePath: process.env.NEXT_PUBLIC_BASE_PATH,
  assetPrefix: process.env.NEXT_PUBLIC_ASSET_PREFIX,
  images: {
    unoptimized: true,
  },
};
