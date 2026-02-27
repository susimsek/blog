if (typeof global.Request === 'undefined') {
  global.Request = class {};
}

const path = require('path');
const nextJest = require('next/jest');
const { compilerOptions } = require('./tsconfig.json');

const createJestConfig = nextJest({
  dir: './',
});

const toJestMapper = (paths, rootDir = '<rootDir>/') => {
  const mapper = {};
  Object.entries(paths || {}).forEach(([alias, targets]) => {
    if (!Array.isArray(targets) || targets.length === 0) {
      return;
    }
    const target = targets[0];
    const escapedAlias = alias.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const hasWildcard = escapedAlias.includes('\\*');
    const regexKey = `^${escapedAlias.replace('\\*', '(.*)')}$`;
    mapper[regexKey] = `${rootDir}${target.replace(/^\.\//, '').replace(/\*$/, '$1')}`;

    if (!hasWildcard && alias.endsWith('/')) {
      mapper[`^${escapedAlias}(.*)$`] = `${rootDir}${target.replace(/^\.\//, '')}$1`;
    }
  });
  return mapper;
};

const customJestConfig = {
  testEnvironment: 'jsdom',
  roots: ['<rootDir>'],
  modulePaths: [compilerOptions.baseUrl],
  moduleNameMapper: {
    ...toJestMapper(compilerOptions.paths),
  },
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
  testPathIgnorePatterns: ['<rootDir>/node_modules/', '<rootDir>/.next/', '/__mocks__/', '<rootDir>/__tests__/utils/'],
  coveragePathIgnorePatterns: ['<rootDir>/__tests__/utils/'],
  coverageDirectory: './coverage',
};

const baseConfig = createJestConfig(customJestConfig);

module.exports = async (...args) => {
  const config = await baseConfig(...args);
  config.setupFilesAfterEnv = [path.join(__dirname, 'jest.setup.ts')];
  // Treat SVG imports as React components in tests (the default Next fileMock returns an object).
  config.moduleNameMapper['^.+\\.(svg)$'] = '<rootDir>/__tests__/__mocks__/svgMock.tsx';
  // Next 16 + react-syntax-highlighter@16 pulls in ESM deps (refractor/hastscript). Allow SWC to transform them.
  config.transformIgnorePatterns = ['^.+\\\\.module\\\\.(css|sass|scss)$', '/node_modules/(?!refractor|hastscript)/'];
  config.reporters = [
    'default',
    [
      require.resolve('jest-sonar'),
      {
        outputDirectory: './coverage',
        outputName: 'test-report.xml',
        reportedFilePath: 'relative',
      },
    ],
  ];
  config.coverageThreshold = {
    global: {
      statements: 95,
      functions: 95,
      lines: 95,
    },
  };
  return config;
};
