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
  moduleNameMapper: pathsToModuleNameMapper(compilerOptions.paths, {
    prefix: '<rootDir>/',
  }),
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
  testPathIgnorePatterns: ['<rootDir>/node_modules/', '/__mocks__/'],
  coverageDirectory: './coverage',
};

const baseConfig = createJestConfig(customJestConfig);

module.exports = async (...args) => {
  const config = await baseConfig(...args);
  config.setupFilesAfterEnv = [path.join(__dirname, 'jest.setup.js')];
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
