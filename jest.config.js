const nextJest = require('next/jest');

const createJestConfig = nextJest({
  dir: './',
});

const customJestConfig = {
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  testEnvironment: 'jsdom',
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
  },
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
  testPathIgnorePatterns: ['<rootDir>/node_modules/'],
  reporters: [
    'default',
    [
      'jest-sonar',
      {
        outputDirectory: './coverage',
        outputName: 'test-report.xml',
        reportedFilePath: 'relative',
      },
    ],
  ],
  coverageDirectory: './coverage',
};

module.exports = createJestConfig(customJestConfig);
