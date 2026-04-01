import type { CodegenConfig } from '@graphql-codegen/cli';

const config: CodegenConfig = {
  schema: 'internal/graphql/schema.graphqls',
  documents: ['src/graphql/operations/**/*.graphql'],
  generates: {
    'src/graphql/generated/graphql.ts': {
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
      plugins: ['typescript', 'typescript-operations', 'typed-document-node'],
    },
  },
  ignoreNoDocuments: false,
};

export default config;
