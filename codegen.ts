import type { CodegenConfig } from '@graphql-codegen/cli';

const config: CodegenConfig = {
  schema: 'internal/graphql/schema.graphqls',
  documents: ['src/graphql/operations/**/*.graphql'],
  generates: {
    'src/graphql/generated/schema.ts': {
      config: {
        scalars: {
          Date: 'string',
          DateTime: 'string',
          Email: 'string',
          Locale: 'string',
          URL: 'string',
        },
      },
      plugins: ['typescript'],
    },
    'src/graphql/generated/operations.ts': {
      config: {
        dedupeOperationSuffix: true,
        scalars: {
          Date: 'string',
          DateTime: 'string',
          Email: 'string',
          Locale: 'string',
          URL: 'string',
        },
      },
      plugins: ['typescript-operations', 'typed-document-node'],
    },
  },
  ignoreNoDocuments: false,
};

export default config;
