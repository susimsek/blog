import { TypedDocumentNode as DocumentNode } from '@graphql-typed-document-node/core';
export type Maybe<T> = T | null;
export type InputMaybe<T> = Maybe<T>;
export type Exact<T extends { [key: string]: unknown }> = { [K in keyof T]: T[K] };
export type MakeOptional<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]?: Maybe<T[SubKey]> };
export type MakeMaybe<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]: Maybe<T[SubKey]> };
export type MakeEmpty<T extends { [key: string]: unknown }, K extends keyof T> = { [_ in K]?: never };
export type Incremental<T> = T | { [P in keyof T]?: P extends ' $fragmentName' | '__typename' ? T[P] : never };
/** All built-in and custom scalars, mapped to their actual values */
export type Scalars = {
  ID: { input: string; output: string };
  String: { input: string; output: string };
  Boolean: { input: boolean; output: boolean };
  Int: { input: number; output: number };
  Float: { input: number; output: number };
};

export type Mutation = {
  __typename?: 'Mutation';
  confirmNewsletterSubscription: NewsletterMutationResult;
  incrementPostHit: PostMetricResult;
  incrementPostLike: PostMetricResult;
  resendNewsletterConfirmation: NewsletterMutationResult;
  subscribeNewsletter: NewsletterMutationResult;
  unsubscribeNewsletter: NewsletterMutationResult;
};

export type MutationConfirmNewsletterSubscriptionArgs = {
  token: Scalars['String']['input'];
};

export type MutationIncrementPostHitArgs = {
  postId: Scalars['ID']['input'];
};

export type MutationIncrementPostLikeArgs = {
  postId: Scalars['ID']['input'];
};

export type MutationResendNewsletterConfirmationArgs = {
  input: NewsletterResendInput;
};

export type MutationSubscribeNewsletterArgs = {
  input: NewsletterSubscribeInput;
};

export type MutationUnsubscribeNewsletterArgs = {
  token: Scalars['String']['input'];
};

export type NewsletterMutationResult = {
  __typename?: 'NewsletterMutationResult';
  forwardTo?: Maybe<Scalars['String']['output']>;
  status: Scalars['String']['output'];
};

export type NewsletterResendInput = {
  email: Scalars['String']['input'];
  locale: Scalars['String']['input'];
  terms: Scalars['Boolean']['input'];
};

export type NewsletterSubscribeInput = {
  email: Scalars['String']['input'];
  formName?: InputMaybe<Scalars['String']['input']>;
  locale: Scalars['String']['input'];
  tags?: InputMaybe<Array<Scalars['String']['input']>>;
  terms: Scalars['Boolean']['input'];
};

export type Post = {
  __typename?: 'Post';
  category?: Maybe<PostCategory>;
  id: Scalars['ID']['output'];
  publishedDate: Scalars['String']['output'];
  readingTime: Scalars['Int']['output'];
  searchText: Scalars['String']['output'];
  slug: Scalars['String']['output'];
  source?: Maybe<Scalars['String']['output']>;
  summary: Scalars['String']['output'];
  thumbnail?: Maybe<Scalars['String']['output']>;
  title: Scalars['String']['output'];
  topics?: Maybe<Array<Topic>>;
  updatedDate?: Maybe<Scalars['String']['output']>;
  url?: Maybe<Scalars['String']['output']>;
};

export type PostCategory = {
  __typename?: 'PostCategory';
  id: Scalars['ID']['output'];
  name: Scalars['String']['output'];
};

export type PostConnection = {
  __typename?: 'PostConnection';
  engagement: Array<PostEngagement>;
  locale?: Maybe<Scalars['String']['output']>;
  nodes: Array<Post>;
  page: Scalars['Int']['output'];
  size: Scalars['Int']['output'];
  sort?: Maybe<Scalars['String']['output']>;
  status: Scalars['String']['output'];
  total: Scalars['Int']['output'];
};

export type PostEngagement = {
  __typename?: 'PostEngagement';
  hits: Scalars['Int']['output'];
  likes: Scalars['Int']['output'];
  postId: Scalars['ID']['output'];
};

export type PostMetricResult = {
  __typename?: 'PostMetricResult';
  hits?: Maybe<Scalars['Int']['output']>;
  likes?: Maybe<Scalars['Int']['output']>;
  postId: Scalars['ID']['output'];
  status: Scalars['String']['output'];
};

export type PostResult = {
  __typename?: 'PostResult';
  engagement?: Maybe<PostEngagement>;
  locale?: Maybe<Scalars['String']['output']>;
  node?: Maybe<Post>;
  status: Scalars['String']['output'];
};

export type PostsQueryInput = {
  page?: InputMaybe<Scalars['Int']['input']>;
  scopeIds?: InputMaybe<Array<Scalars['ID']['input']>>;
  size?: InputMaybe<Scalars['Int']['input']>;
  sort?: InputMaybe<SortOrder>;
};

export type Query = {
  __typename?: 'Query';
  post: PostResult;
  posts: PostConnection;
};

export type QueryPostArgs = {
  id: Scalars['ID']['input'];
  locale: Scalars['String']['input'];
};

export type QueryPostsArgs = {
  input?: InputMaybe<PostsQueryInput>;
  locale: Scalars['String']['input'];
};

export enum SortOrder {
  Asc = 'ASC',
  Desc = 'DESC',
}

export type Topic = {
  __typename?: 'Topic';
  color: Scalars['String']['output'];
  id: Scalars['ID']['output'];
  link?: Maybe<Scalars['String']['output']>;
  name: Scalars['String']['output'];
};

export type PostsQueryVariables = Exact<{
  locale: Scalars['String']['input'];
  input?: InputMaybe<PostsQueryInput>;
}>;

export type PostsQuery = {
  __typename?: 'Query';
  posts: {
    __typename?: 'PostConnection';
    status: string;
    locale?: string | null;
    total: number;
    page: number;
    size: number;
    sort?: string | null;
    engagement: Array<{ __typename?: 'PostEngagement'; postId: string; likes: number; hits: number }>;
    nodes: Array<{
      __typename?: 'Post';
      id: string;
      slug: string;
      title: string;
      publishedDate: string;
      updatedDate?: string | null;
      summary: string;
      searchText: string;
      thumbnail?: string | null;
      readingTime: number;
      source?: string | null;
      url?: string | null;
      category?: { __typename?: 'PostCategory'; id: string; name: string } | null;
      topics?: Array<{ __typename?: 'Topic'; id: string; name: string; color: string; link?: string | null }> | null;
    }>;
  };
};

export type PostQueryVariables = Exact<{
  locale: Scalars['String']['input'];
  id: Scalars['ID']['input'];
}>;

export type PostQuery = {
  __typename?: 'Query';
  post: {
    __typename?: 'PostResult';
    status: string;
    locale?: string | null;
    node?: {
      __typename?: 'Post';
      id: string;
      slug: string;
      title: string;
      publishedDate: string;
      updatedDate?: string | null;
      summary: string;
      searchText: string;
      thumbnail?: string | null;
      readingTime: number;
      source?: string | null;
      url?: string | null;
      category?: { __typename?: 'PostCategory'; id: string; name: string } | null;
      topics?: Array<{ __typename?: 'Topic'; id: string; name: string; color: string; link?: string | null }> | null;
    } | null;
    engagement?: { __typename?: 'PostEngagement'; postId: string; likes: number; hits: number } | null;
  };
};

export type IncrementPostLikeMutationVariables = Exact<{
  postId: Scalars['ID']['input'];
}>;

export type IncrementPostLikeMutation = {
  __typename?: 'Mutation';
  incrementPostLike: {
    __typename?: 'PostMetricResult';
    status: string;
    postId: string;
    likes?: number | null;
    hits?: number | null;
  };
};

export type IncrementPostHitMutationVariables = Exact<{
  postId: Scalars['ID']['input'];
}>;

export type IncrementPostHitMutation = {
  __typename?: 'Mutation';
  incrementPostHit: {
    __typename?: 'PostMetricResult';
    status: string;
    postId: string;
    likes?: number | null;
    hits?: number | null;
  };
};

export type SubscribeNewsletterMutationVariables = Exact<{
  input: NewsletterSubscribeInput;
}>;

export type SubscribeNewsletterMutation = {
  __typename?: 'Mutation';
  subscribeNewsletter: { __typename?: 'NewsletterMutationResult'; status: string; forwardTo?: string | null };
};

export type ResendNewsletterConfirmationMutationVariables = Exact<{
  input: NewsletterResendInput;
}>;

export type ResendNewsletterConfirmationMutation = {
  __typename?: 'Mutation';
  resendNewsletterConfirmation: { __typename?: 'NewsletterMutationResult'; status: string; forwardTo?: string | null };
};

export type ConfirmNewsletterSubscriptionMutationVariables = Exact<{
  token: Scalars['String']['input'];
}>;

export type ConfirmNewsletterSubscriptionMutation = {
  __typename?: 'Mutation';
  confirmNewsletterSubscription: { __typename?: 'NewsletterMutationResult'; status: string; forwardTo?: string | null };
};

export type UnsubscribeNewsletterMutationVariables = Exact<{
  token: Scalars['String']['input'];
}>;

export type UnsubscribeNewsletterMutation = {
  __typename?: 'Mutation';
  unsubscribeNewsletter: { __typename?: 'NewsletterMutationResult'; status: string; forwardTo?: string | null };
};

export const PostsDocument = {
  kind: 'Document',
  definitions: [
    {
      kind: 'OperationDefinition',
      operation: 'query',
      name: { kind: 'Name', value: 'posts' },
      variableDefinitions: [
        {
          kind: 'VariableDefinition',
          variable: { kind: 'Variable', name: { kind: 'Name', value: 'locale' } },
          type: { kind: 'NonNullType', type: { kind: 'NamedType', name: { kind: 'Name', value: 'String' } } },
        },
        {
          kind: 'VariableDefinition',
          variable: { kind: 'Variable', name: { kind: 'Name', value: 'input' } },
          type: { kind: 'NamedType', name: { kind: 'Name', value: 'PostsQueryInput' } },
        },
      ],
      selectionSet: {
        kind: 'SelectionSet',
        selections: [
          {
            kind: 'Field',
            name: { kind: 'Name', value: 'posts' },
            arguments: [
              {
                kind: 'Argument',
                name: { kind: 'Name', value: 'locale' },
                value: { kind: 'Variable', name: { kind: 'Name', value: 'locale' } },
              },
              {
                kind: 'Argument',
                name: { kind: 'Name', value: 'input' },
                value: { kind: 'Variable', name: { kind: 'Name', value: 'input' } },
              },
            ],
            selectionSet: {
              kind: 'SelectionSet',
              selections: [
                { kind: 'Field', name: { kind: 'Name', value: 'status' } },
                { kind: 'Field', name: { kind: 'Name', value: 'locale' } },
                { kind: 'Field', name: { kind: 'Name', value: 'total' } },
                { kind: 'Field', name: { kind: 'Name', value: 'page' } },
                { kind: 'Field', name: { kind: 'Name', value: 'size' } },
                { kind: 'Field', name: { kind: 'Name', value: 'sort' } },
                {
                  kind: 'Field',
                  name: { kind: 'Name', value: 'engagement' },
                  selectionSet: {
                    kind: 'SelectionSet',
                    selections: [
                      { kind: 'Field', name: { kind: 'Name', value: 'postId' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'likes' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'hits' } },
                    ],
                  },
                },
                {
                  kind: 'Field',
                  name: { kind: 'Name', value: 'nodes' },
                  selectionSet: {
                    kind: 'SelectionSet',
                    selections: [
                      { kind: 'Field', name: { kind: 'Name', value: 'id' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'slug' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'title' } },
                      {
                        kind: 'Field',
                        name: { kind: 'Name', value: 'category' },
                        selectionSet: {
                          kind: 'SelectionSet',
                          selections: [
                            { kind: 'Field', name: { kind: 'Name', value: 'id' } },
                            { kind: 'Field', name: { kind: 'Name', value: 'name' } },
                          ],
                        },
                      },
                      { kind: 'Field', name: { kind: 'Name', value: 'publishedDate' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'updatedDate' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'summary' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'searchText' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'thumbnail' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'readingTime' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'source' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'url' } },
                      {
                        kind: 'Field',
                        name: { kind: 'Name', value: 'topics' },
                        selectionSet: {
                          kind: 'SelectionSet',
                          selections: [
                            { kind: 'Field', name: { kind: 'Name', value: 'id' } },
                            { kind: 'Field', name: { kind: 'Name', value: 'name' } },
                            { kind: 'Field', name: { kind: 'Name', value: 'color' } },
                            { kind: 'Field', name: { kind: 'Name', value: 'link' } },
                          ],
                        },
                      },
                    ],
                  },
                },
              ],
            },
          },
        ],
      },
    },
  ],
} as unknown as DocumentNode<PostsQuery, PostsQueryVariables>;
export const PostDocument = {
  kind: 'Document',
  definitions: [
    {
      kind: 'OperationDefinition',
      operation: 'query',
      name: { kind: 'Name', value: 'post' },
      variableDefinitions: [
        {
          kind: 'VariableDefinition',
          variable: { kind: 'Variable', name: { kind: 'Name', value: 'locale' } },
          type: { kind: 'NonNullType', type: { kind: 'NamedType', name: { kind: 'Name', value: 'String' } } },
        },
        {
          kind: 'VariableDefinition',
          variable: { kind: 'Variable', name: { kind: 'Name', value: 'id' } },
          type: { kind: 'NonNullType', type: { kind: 'NamedType', name: { kind: 'Name', value: 'ID' } } },
        },
      ],
      selectionSet: {
        kind: 'SelectionSet',
        selections: [
          {
            kind: 'Field',
            name: { kind: 'Name', value: 'post' },
            arguments: [
              {
                kind: 'Argument',
                name: { kind: 'Name', value: 'locale' },
                value: { kind: 'Variable', name: { kind: 'Name', value: 'locale' } },
              },
              {
                kind: 'Argument',
                name: { kind: 'Name', value: 'id' },
                value: { kind: 'Variable', name: { kind: 'Name', value: 'id' } },
              },
            ],
            selectionSet: {
              kind: 'SelectionSet',
              selections: [
                { kind: 'Field', name: { kind: 'Name', value: 'status' } },
                { kind: 'Field', name: { kind: 'Name', value: 'locale' } },
                {
                  kind: 'Field',
                  name: { kind: 'Name', value: 'node' },
                  selectionSet: {
                    kind: 'SelectionSet',
                    selections: [
                      { kind: 'Field', name: { kind: 'Name', value: 'id' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'slug' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'title' } },
                      {
                        kind: 'Field',
                        name: { kind: 'Name', value: 'category' },
                        selectionSet: {
                          kind: 'SelectionSet',
                          selections: [
                            { kind: 'Field', name: { kind: 'Name', value: 'id' } },
                            { kind: 'Field', name: { kind: 'Name', value: 'name' } },
                          ],
                        },
                      },
                      { kind: 'Field', name: { kind: 'Name', value: 'publishedDate' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'updatedDate' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'summary' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'searchText' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'thumbnail' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'readingTime' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'source' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'url' } },
                      {
                        kind: 'Field',
                        name: { kind: 'Name', value: 'topics' },
                        selectionSet: {
                          kind: 'SelectionSet',
                          selections: [
                            { kind: 'Field', name: { kind: 'Name', value: 'id' } },
                            { kind: 'Field', name: { kind: 'Name', value: 'name' } },
                            { kind: 'Field', name: { kind: 'Name', value: 'color' } },
                            { kind: 'Field', name: { kind: 'Name', value: 'link' } },
                          ],
                        },
                      },
                    ],
                  },
                },
                {
                  kind: 'Field',
                  name: { kind: 'Name', value: 'engagement' },
                  selectionSet: {
                    kind: 'SelectionSet',
                    selections: [
                      { kind: 'Field', name: { kind: 'Name', value: 'postId' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'likes' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'hits' } },
                    ],
                  },
                },
              ],
            },
          },
        ],
      },
    },
  ],
} as unknown as DocumentNode<PostQuery, PostQueryVariables>;
export const IncrementPostLikeDocument = {
  kind: 'Document',
  definitions: [
    {
      kind: 'OperationDefinition',
      operation: 'mutation',
      name: { kind: 'Name', value: 'incrementPostLike' },
      variableDefinitions: [
        {
          kind: 'VariableDefinition',
          variable: { kind: 'Variable', name: { kind: 'Name', value: 'postId' } },
          type: { kind: 'NonNullType', type: { kind: 'NamedType', name: { kind: 'Name', value: 'ID' } } },
        },
      ],
      selectionSet: {
        kind: 'SelectionSet',
        selections: [
          {
            kind: 'Field',
            name: { kind: 'Name', value: 'incrementPostLike' },
            arguments: [
              {
                kind: 'Argument',
                name: { kind: 'Name', value: 'postId' },
                value: { kind: 'Variable', name: { kind: 'Name', value: 'postId' } },
              },
            ],
            selectionSet: {
              kind: 'SelectionSet',
              selections: [
                { kind: 'Field', name: { kind: 'Name', value: 'status' } },
                { kind: 'Field', name: { kind: 'Name', value: 'postId' } },
                { kind: 'Field', name: { kind: 'Name', value: 'likes' } },
                { kind: 'Field', name: { kind: 'Name', value: 'hits' } },
              ],
            },
          },
        ],
      },
    },
  ],
} as unknown as DocumentNode<IncrementPostLikeMutation, IncrementPostLikeMutationVariables>;
export const IncrementPostHitDocument = {
  kind: 'Document',
  definitions: [
    {
      kind: 'OperationDefinition',
      operation: 'mutation',
      name: { kind: 'Name', value: 'incrementPostHit' },
      variableDefinitions: [
        {
          kind: 'VariableDefinition',
          variable: { kind: 'Variable', name: { kind: 'Name', value: 'postId' } },
          type: { kind: 'NonNullType', type: { kind: 'NamedType', name: { kind: 'Name', value: 'ID' } } },
        },
      ],
      selectionSet: {
        kind: 'SelectionSet',
        selections: [
          {
            kind: 'Field',
            name: { kind: 'Name', value: 'incrementPostHit' },
            arguments: [
              {
                kind: 'Argument',
                name: { kind: 'Name', value: 'postId' },
                value: { kind: 'Variable', name: { kind: 'Name', value: 'postId' } },
              },
            ],
            selectionSet: {
              kind: 'SelectionSet',
              selections: [
                { kind: 'Field', name: { kind: 'Name', value: 'status' } },
                { kind: 'Field', name: { kind: 'Name', value: 'postId' } },
                { kind: 'Field', name: { kind: 'Name', value: 'likes' } },
                { kind: 'Field', name: { kind: 'Name', value: 'hits' } },
              ],
            },
          },
        ],
      },
    },
  ],
} as unknown as DocumentNode<IncrementPostHitMutation, IncrementPostHitMutationVariables>;
export const SubscribeNewsletterDocument = {
  kind: 'Document',
  definitions: [
    {
      kind: 'OperationDefinition',
      operation: 'mutation',
      name: { kind: 'Name', value: 'subscribeNewsletter' },
      variableDefinitions: [
        {
          kind: 'VariableDefinition',
          variable: { kind: 'Variable', name: { kind: 'Name', value: 'input' } },
          type: {
            kind: 'NonNullType',
            type: { kind: 'NamedType', name: { kind: 'Name', value: 'NewsletterSubscribeInput' } },
          },
        },
      ],
      selectionSet: {
        kind: 'SelectionSet',
        selections: [
          {
            kind: 'Field',
            name: { kind: 'Name', value: 'subscribeNewsletter' },
            arguments: [
              {
                kind: 'Argument',
                name: { kind: 'Name', value: 'input' },
                value: { kind: 'Variable', name: { kind: 'Name', value: 'input' } },
              },
            ],
            selectionSet: {
              kind: 'SelectionSet',
              selections: [
                { kind: 'Field', name: { kind: 'Name', value: 'status' } },
                { kind: 'Field', name: { kind: 'Name', value: 'forwardTo' } },
              ],
            },
          },
        ],
      },
    },
  ],
} as unknown as DocumentNode<SubscribeNewsletterMutation, SubscribeNewsletterMutationVariables>;
export const ResendNewsletterConfirmationDocument = {
  kind: 'Document',
  definitions: [
    {
      kind: 'OperationDefinition',
      operation: 'mutation',
      name: { kind: 'Name', value: 'resendNewsletterConfirmation' },
      variableDefinitions: [
        {
          kind: 'VariableDefinition',
          variable: { kind: 'Variable', name: { kind: 'Name', value: 'input' } },
          type: {
            kind: 'NonNullType',
            type: { kind: 'NamedType', name: { kind: 'Name', value: 'NewsletterResendInput' } },
          },
        },
      ],
      selectionSet: {
        kind: 'SelectionSet',
        selections: [
          {
            kind: 'Field',
            name: { kind: 'Name', value: 'resendNewsletterConfirmation' },
            arguments: [
              {
                kind: 'Argument',
                name: { kind: 'Name', value: 'input' },
                value: { kind: 'Variable', name: { kind: 'Name', value: 'input' } },
              },
            ],
            selectionSet: {
              kind: 'SelectionSet',
              selections: [
                { kind: 'Field', name: { kind: 'Name', value: 'status' } },
                { kind: 'Field', name: { kind: 'Name', value: 'forwardTo' } },
              ],
            },
          },
        ],
      },
    },
  ],
} as unknown as DocumentNode<ResendNewsletterConfirmationMutation, ResendNewsletterConfirmationMutationVariables>;
export const ConfirmNewsletterSubscriptionDocument = {
  kind: 'Document',
  definitions: [
    {
      kind: 'OperationDefinition',
      operation: 'mutation',
      name: { kind: 'Name', value: 'confirmNewsletterSubscription' },
      variableDefinitions: [
        {
          kind: 'VariableDefinition',
          variable: { kind: 'Variable', name: { kind: 'Name', value: 'token' } },
          type: { kind: 'NonNullType', type: { kind: 'NamedType', name: { kind: 'Name', value: 'String' } } },
        },
      ],
      selectionSet: {
        kind: 'SelectionSet',
        selections: [
          {
            kind: 'Field',
            name: { kind: 'Name', value: 'confirmNewsletterSubscription' },
            arguments: [
              {
                kind: 'Argument',
                name: { kind: 'Name', value: 'token' },
                value: { kind: 'Variable', name: { kind: 'Name', value: 'token' } },
              },
            ],
            selectionSet: {
              kind: 'SelectionSet',
              selections: [
                { kind: 'Field', name: { kind: 'Name', value: 'status' } },
                { kind: 'Field', name: { kind: 'Name', value: 'forwardTo' } },
              ],
            },
          },
        ],
      },
    },
  ],
} as unknown as DocumentNode<ConfirmNewsletterSubscriptionMutation, ConfirmNewsletterSubscriptionMutationVariables>;
export const UnsubscribeNewsletterDocument = {
  kind: 'Document',
  definitions: [
    {
      kind: 'OperationDefinition',
      operation: 'mutation',
      name: { kind: 'Name', value: 'unsubscribeNewsletter' },
      variableDefinitions: [
        {
          kind: 'VariableDefinition',
          variable: { kind: 'Variable', name: { kind: 'Name', value: 'token' } },
          type: { kind: 'NonNullType', type: { kind: 'NamedType', name: { kind: 'Name', value: 'String' } } },
        },
      ],
      selectionSet: {
        kind: 'SelectionSet',
        selections: [
          {
            kind: 'Field',
            name: { kind: 'Name', value: 'unsubscribeNewsletter' },
            arguments: [
              {
                kind: 'Argument',
                name: { kind: 'Name', value: 'token' },
                value: { kind: 'Variable', name: { kind: 'Name', value: 'token' } },
              },
            ],
            selectionSet: {
              kind: 'SelectionSet',
              selections: [
                { kind: 'Field', name: { kind: 'Name', value: 'status' } },
                { kind: 'Field', name: { kind: 'Name', value: 'forwardTo' } },
              ],
            },
          },
        ],
      },
    },
  ],
} as unknown as DocumentNode<UnsubscribeNewsletterMutation, UnsubscribeNewsletterMutationVariables>;
