import type { NextConfig } from "next";

const isGithubActions = process.env.GITHUB_ACTIONS || false;

let basePath = "";
let assetPrefix = "";

if (isGithubActions) {
  const repo = process.env.GITHUB_REPOSITORY?.replace(/.*?\//, "") || "";
  basePath = `/${repo}`;
  assetPrefix = `/${repo}/`;
}

const nextConfig: NextConfig = {
  poweredByHeader: false,
  distDir: 'build',
  output: 'export',
  images: {
    unoptimized: true,
  },
  basePath,
  assetPrefix,
  webpack: config => {
    return config;
  },
};

export default nextConfig;
