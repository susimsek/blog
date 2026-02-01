if (typeof global.Request === 'undefined') {
  global.Request = class {};
}

const path = require('path');
const nextJest = require('next/jest');
const { pathsToModuleNameMapper } = require('ts-jest');
const { compilerOptions } = require('./tsconfig.json');

const createJestConfig = nextJest({
  dir: './',
});

const customJestConfig = {
  testEnvironment: 'jsdom',
  moduleNameMapper: {
    ...pathsToModuleNameMapper(compilerOptions.paths, {
      prefix: '<rootDir>/',
    }),
  },
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
  testPathIgnorePatterns: ['<rootDir>/node_modules/', '/__mocks__/', '<rootDir>/__tests__/utils/'],
  coverageDirectory: './coverage',
};

const baseConfig = createJestConfig(customJestConfig);

module.exports = async (...args) => {
  const config = await baseConfig(...args);
  config.setupFilesAfterEnv = [path.join(__dirname, 'jest.setup.js')];
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
  return config;
};
