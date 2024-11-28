const isGithubActions = process.env.GITHUB_ACTIONS || false;

let basePath = "";
let assetPrefix = "";

if (isGithubActions) {
  const repo = process.env.GITHUB_REPOSITORY?.replace(/.*?\//, "") || "";
  basePath = `/${repo}`;
  assetPrefix = `/${repo}`;
}

module.exports = {
  poweredByHeader: false,
  distDir: "build",
  output: "export",
  basePath,
  assetPrefix,
  images: {
    unoptimized: true,
  },
};
