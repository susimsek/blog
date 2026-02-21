import type { NextConfig } from 'next';

const isDev = process.env.NODE_ENV === 'development';
const devApiOrigin = process.env.NEXT_PUBLIC_DEV_API_ORIGIN ?? 'http://localhost:8080';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  trailingSlash: false,
  distDir: 'build',
  output: 'export',
  basePath: process.env.NEXT_PUBLIC_BASE_PATH,
  assetPrefix: process.env.NEXT_PUBLIC_ASSET_PREFIX,
  sassOptions: {
    quietDeps: true,
    silenceDeprecations: ['import'],
  },
  images: {
    unoptimized: true,
  },
  turbopack: {
    rules: {
      '*.svg': {
        loaders: ['@svgr/webpack'],
        as: '*.js',
      },
    },
  },
  ...(isDev
    ? {
        async rewrites() {
          return [
            {
              source: '/graphql',
              destination: `${devApiOrigin}/graphql`,
            },
            {
              source: '/api/:path*',
              destination: `${devApiOrigin}/api/:path*`,
            },
          ];
        },
      }
    : {}),
};

export default nextConfig;
