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

/** Status values returned by content read operations. */
export enum ContentQueryStatus {
  /** The operation failed unexpectedly. */
  Failed = 'FAILED',
  /** The supplied post identifier was invalid. */
  InvalidPostId = 'INVALID_POST_ID',
  /** The supplied scope identifiers were invalid or exceeded validation limits. */
  InvalidScopeIds = 'INVALID_SCOPE_IDS',
  /** The requested resource could not be found. */
  NotFound = 'NOT_FOUND',
  /** The backing service or repository is temporarily unavailable. */
  ServiceUnavailable = 'SERVICE_UNAVAILABLE',
  /** The operation completed successfully. */
  Success = 'SUCCESS',
}

/** Supported application locales. */
export enum Locale {
  /** English locale. */
  En = 'EN',
  /** Turkish locale. */
  Tr = 'TR',
}

/** Write operations for engagement counters and newsletter flows. */
export type Mutation = {
  __typename?: 'Mutation';
  /** Confirms a newsletter subscription by using a previously issued confirmation token. */
  confirmNewsletterSubscription: NewsletterMutationResult;
  /** Increments the hit counter for a post and returns the updated metric payload. */
  incrementPostHit: PostMetricResult;
  /** Increments the like counter for a post and returns the updated metric payload. */
  incrementPostLike: PostMetricResult;
  /** Resends a pending newsletter confirmation email. */
  resendNewsletterConfirmation: NewsletterMutationResult;
  /** Starts the newsletter subscription flow for an email address. */
  subscribeNewsletter: NewsletterMutationResult;
  /** Cancels a newsletter subscription by using a signed unsubscribe token. */
  unsubscribeNewsletter: NewsletterMutationResult;
};

/** Write operations for engagement counters and newsletter flows. */
export type MutationConfirmNewsletterSubscriptionArgs = {
  token: Scalars['String']['input'];
};

/** Write operations for engagement counters and newsletter flows. */
export type MutationIncrementPostHitArgs = {
  postId: Scalars['ID']['input'];
};

/** Write operations for engagement counters and newsletter flows. */
export type MutationIncrementPostLikeArgs = {
  postId: Scalars['ID']['input'];
};

/** Write operations for engagement counters and newsletter flows. */
export type MutationResendNewsletterConfirmationArgs = {
  input: NewsletterResendInput;
};

/** Write operations for engagement counters and newsletter flows. */
export type MutationSubscribeNewsletterArgs = {
  input: NewsletterSubscribeInput;
};

/** Write operations for engagement counters and newsletter flows. */
export type MutationUnsubscribeNewsletterArgs = {
  token: Scalars['String']['input'];
};

/** Mutation result for newsletter subscription workflows. */
export type NewsletterMutationResult = {
  __typename?: 'NewsletterMutationResult';
  /** Optional client route that the frontend should navigate to after the operation. */
  forwardTo?: Maybe<Scalars['String']['output']>;
  /** Operation status such as success, invalid-email, rate-limited, invalid-link, or config-error. */
  status: NewsletterMutationStatus;
};

/** Status values returned by newsletter mutations. */
export enum NewsletterMutationStatus {
  /** The server configuration is incomplete or invalid for this workflow. */
  ConfigError = 'CONFIG_ERROR',
  /** The supplied link or token has expired. */
  Expired = 'EXPIRED',
  /** The operation failed unexpectedly. */
  Failed = 'FAILED',
  /** The supplied email address was invalid. */
  InvalidEmail = 'INVALID_EMAIL',
  /** The supplied confirmation or unsubscribe link was invalid. */
  InvalidLink = 'INVALID_LINK',
  /** The caller exceeded the allowed request rate. */
  RateLimited = 'RATE_LIMITED',
  /** The backing service or repository is temporarily unavailable. */
  ServiceUnavailable = 'SERVICE_UNAVAILABLE',
  /** The operation completed successfully. */
  Success = 'SUCCESS',
  /** The request could not be completed because of an unexpected internal condition. */
  UnknownError = 'UNKNOWN_ERROR',
}

/** Input payload used when resending a newsletter confirmation email. */
export type NewsletterResendInput = {
  /** Subscriber email address. */
  email: Scalars['String']['input'];
  /** Locale used for the resend response and email copy. */
  locale: Locale;
  /** Consent checkbox value captured from the client form. */
  terms: Scalars['Boolean']['input'];
};

/** Input payload used when a visitor subscribes to the newsletter. */
export type NewsletterSubscribeInput = {
  /** Subscriber email address. */
  email: Scalars['String']['input'];
  /** Optional frontend form name for analytics and diagnostics. */
  formName?: InputMaybe<Scalars['String']['input']>;
  /** Locale used for content and outgoing email copy. */
  locale: Locale;
  /** Optional tags attached to the subscription source. */
  tags?: InputMaybe<Array<Scalars['String']['input']>>;
  /** Consent checkbox value captured from the client form. */
  terms: Scalars['Boolean']['input'];
};

/** Blog post summary returned by content queries. */
export type Post = {
  __typename?: 'Post';
  /** Optional category badge for the post. */
  category?: Maybe<PostCategory>;
  /** Stable post identifier used by routes and engagement records. */
  id: Scalars['ID']['output'];
  /** Original publication timestamp as an ISO-like string. */
  publishedDate: Scalars['String']['output'];
  /** Estimated reading time in minutes. */
  readingTime: Scalars['Int']['output'];
  /** Full-text search index string generated for client-side search. */
  searchText: Scalars['String']['output'];
  /** Human-readable URL slug for the post. */
  slug: Scalars['String']['output'];
  /** Content source such as local or medium. */
  source?: Maybe<Scalars['String']['output']>;
  /** Short summary used in cards, SEO, and previews. */
  summary: Scalars['String']['output'];
  /** Thumbnail image path. */
  thumbnail?: Maybe<Scalars['String']['output']>;
  /** Display title. */
  title: Scalars['String']['output'];
  /** Topic badges linked to the post. */
  topics?: Maybe<Array<Topic>>;
  /** Last update timestamp as an ISO-like string when available. */
  updatedDate?: Maybe<Scalars['String']['output']>;
  /** Canonical source URL when the post originates from an external feed. */
  url?: Maybe<Scalars['String']['output']>;
};

/** Category badge metadata displayed with a post. */
export type PostCategory = {
  __typename?: 'PostCategory';
  /** Badge color token. */
  color: Scalars['String']['output'];
  /** Optional icon identifier. */
  icon?: Maybe<Scalars['String']['output']>;
  /** Stable category identifier. */
  id: Scalars['ID']['output'];
  /** Display name. */
  name: Scalars['String']['output'];
};

/** Paginated result for the posts query. */
export type PostConnection = {
  __typename?: 'PostConnection';
  /** Engagement metrics keyed by post identifier for the returned posts. */
  engagement: Array<PostEngagement>;
  /** Locale used to resolve the response. */
  locale: Locale;
  /** Posts for the current page. */
  nodes: Array<Post>;
  /** Resolved page number after clamping. */
  page: Scalars['Int']['output'];
  /** Resolved page size after clamping. */
  size: Scalars['Int']['output'];
  /** Effective sort direction applied by the service. */
  sort?: Maybe<SortOrder>;
  /** Operation status such as success or a domain-specific failure code. */
  status: ContentQueryStatus;
  /** Total number of posts that matched the filter before pagination. */
  total: Scalars['Int']['output'];
};

/** Engagement counters for a post. */
export type PostEngagement = {
  __typename?: 'PostEngagement';
  /** Total number of hits. */
  hits: Scalars['Int']['output'];
  /** Total number of likes. */
  likes: Scalars['Int']['output'];
  /** Post identifier. */
  postId: Scalars['ID']['output'];
};

/** Mutation result for a post metric update. */
export type PostMetricResult = {
  __typename?: 'PostMetricResult';
  /** Updated hit count when the mutation affects hits. */
  hits?: Maybe<Scalars['Int']['output']>;
  /** Updated like count when the mutation affects likes. */
  likes?: Maybe<Scalars['Int']['output']>;
  /** Post identifier used by the metric update. */
  postId: Scalars['ID']['output'];
  /** Operation status such as success or failed. */
  status: PostMetricStatus;
};

/** Status values returned by post metric mutations. */
export enum PostMetricStatus {
  /** The operation failed unexpectedly. */
  Failed = 'FAILED',
  /** The supplied post identifier was invalid. */
  InvalidPostId = 'INVALID_POST_ID',
  /** The backing service or repository is temporarily unavailable. */
  ServiceUnavailable = 'SERVICE_UNAVAILABLE',
  /** The operation completed successfully. */
  Success = 'SUCCESS',
}

/** Single-post query result. */
export type PostResult = {
  __typename?: 'PostResult';
  /** Engagement counters for the resolved post when available. */
  engagement?: Maybe<PostEngagement>;
  /** Locale used to resolve the response. */
  locale: Locale;
  /** Resolved post when found. */
  node?: Maybe<Post>;
  /** Operation status such as success, not-found, or failed. */
  status: ContentQueryStatus;
};

/** Pagination and filtering controls for the posts query. */
export type PostsQueryInput = {
  /** One-based page index. Values below 1 fall back to the default page. */
  page?: InputMaybe<Scalars['Int']['input']>;
  /** Optional list of post, topic, or category scope identifiers used to constrain the result set. */
  scopeIds?: InputMaybe<Array<Scalars['ID']['input']>>;
  /** Number of posts to return for the current page. */
  size?: InputMaybe<Scalars['Int']['input']>;
  /** Published date sort direction for the result set. */
  sort?: InputMaybe<SortOrder>;
};

/** Read-only operations for blog content discovery. */
export type Query = {
  __typename?: 'Query';
  /** Returns one post and its engagement details for the given locale and post identifier. */
  post: PostResult;
  /** Returns a paginated list of posts for the given locale with engagement data. */
  posts: PostConnection;
};

/** Read-only operations for blog content discovery. */
export type QueryPostArgs = {
  id: Scalars['ID']['input'];
  locale: Locale;
};

/** Read-only operations for blog content discovery. */
export type QueryPostsArgs = {
  input?: InputMaybe<PostsQueryInput>;
  locale: Locale;
};

/** Supported published date sort directions. */
export enum SortOrder {
  /** Ascending order. */
  Asc = 'ASC',
  /** Descending order. */
  Desc = 'DESC',
}

/** Topic badge metadata displayed with a post. */
export type Topic = {
  __typename?: 'Topic';
  /** Badge color token. */
  color: Scalars['String']['output'];
  /** Stable topic identifier. */
  id: Scalars['ID']['output'];
  /** Optional topic route or external link. */
  link?: Maybe<Scalars['String']['output']>;
  /** Display name. */
  name: Scalars['String']['output'];
};

export type PostsQueryVariables = Exact<{
  locale: Locale;
  input?: InputMaybe<PostsQueryInput>;
}>;

export type PostsQuery = {
  __typename?: 'Query';
  posts: {
    __typename?: 'PostConnection';
    status: ContentQueryStatus;
    locale: Locale;
    total: number;
    page: number;
    size: number;
    sort?: SortOrder | null;
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
      category?: { __typename?: 'PostCategory'; id: string; name: string; color: string; icon?: string | null } | null;
      topics?: Array<{ __typename?: 'Topic'; id: string; name: string; color: string; link?: string | null }> | null;
    }>;
  };
};

export type PostQueryVariables = Exact<{
  locale: Locale;
  id: Scalars['ID']['input'];
}>;

export type PostQuery = {
  __typename?: 'Query';
  post: {
    __typename?: 'PostResult';
    status: ContentQueryStatus;
    locale: Locale;
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
      category?: { __typename?: 'PostCategory'; id: string; name: string; color: string; icon?: string | null } | null;
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
    status: PostMetricStatus;
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
    status: PostMetricStatus;
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
  subscribeNewsletter: {
    __typename?: 'NewsletterMutationResult';
    status: NewsletterMutationStatus;
    forwardTo?: string | null;
  };
};

export type ResendNewsletterConfirmationMutationVariables = Exact<{
  input: NewsletterResendInput;
}>;

export type ResendNewsletterConfirmationMutation = {
  __typename?: 'Mutation';
  resendNewsletterConfirmation: {
    __typename?: 'NewsletterMutationResult';
    status: NewsletterMutationStatus;
    forwardTo?: string | null;
  };
};

export type ConfirmNewsletterSubscriptionMutationVariables = Exact<{
  token: Scalars['String']['input'];
}>;

export type ConfirmNewsletterSubscriptionMutation = {
  __typename?: 'Mutation';
  confirmNewsletterSubscription: {
    __typename?: 'NewsletterMutationResult';
    status: NewsletterMutationStatus;
    forwardTo?: string | null;
  };
};

export type UnsubscribeNewsletterMutationVariables = Exact<{
  token: Scalars['String']['input'];
}>;

export type UnsubscribeNewsletterMutation = {
  __typename?: 'Mutation';
  unsubscribeNewsletter: {
    __typename?: 'NewsletterMutationResult';
    status: NewsletterMutationStatus;
    forwardTo?: string | null;
  };
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
          type: { kind: 'NonNullType', type: { kind: 'NamedType', name: { kind: 'Name', value: 'Locale' } } },
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
                            { kind: 'Field', name: { kind: 'Name', value: 'color' } },
                            { kind: 'Field', name: { kind: 'Name', value: 'icon' } },
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
          type: { kind: 'NonNullType', type: { kind: 'NamedType', name: { kind: 'Name', value: 'Locale' } } },
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
                            { kind: 'Field', name: { kind: 'Name', value: 'color' } },
                            { kind: 'Field', name: { kind: 'Name', value: 'icon' } },
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
