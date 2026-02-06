import { defineConfig } from 'eslint/config';
import nextVitals from 'eslint-config-next/core-web-vitals';
import nextTs from 'eslint-config-next/typescript';

export default defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    files: ['**/*.{js,cjs,mjs}'],
    rules: {
      '@typescript-eslint/no-require-imports': 'off',
    },
  },
  {
    files: ['**/__tests__/**/*.{js,jsx,ts,tsx}', '**/*.test.{js,jsx,ts,tsx}'],
    rules: {
      '@next/next/no-head-element': 'off',
      '@next/next/no-img-element': 'off',
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-require-imports': 'off',
      'react/display-name': 'off',
    },
  },
  {
    ignores: [
      'node/**',
      'node_modules/**',
      '.next/**',
      'out/**',
      'build/**',
      'dist/**',
      '.cache/**',
      'coverage/**',
      '.nyc_output/**',
      'public/**',
      'src/pages_legacy/**',
      'src/generated/**',
      'target/**',
      '.git/**',
      '.circleci/**',
      '.github/**',
      'next-env.d.ts',
      'pnpm-lock.yaml',
      'yarn.lock',
      '.dockerignore',
      'Dockerfile',
      'Dockerfile.*',
      'docker-compose*.yml',
      'docker-compose*.yaml',
    ],
  },
]);
