/** Internal type. DO NOT USE DIRECTLY. */
type Exact<T extends { [key: string]: unknown }> = { [K in keyof T]: T[K] };
/** Internal type. DO NOT USE DIRECTLY. */
export type Incremental<T> = T | { [P in keyof T]?: P extends ' $fragmentName' | '__typename' ? T[P] : never };
import { TypedDocumentNode as DocumentNode } from '@graphql-typed-document-node/core';
/** Input payload used when a visitor posts a guest comment. */
export type AddCommentInput = {
  /** Email address captured for moderation only. */
  authorEmail: string;
  /** Display name shown publicly with the comment. */
  authorName: string;
  /** Plain-text comment body. */
  content: string;
  /** Optional parent comment identifier. Only one reply level is supported. */
  parentId?: string | number | null | undefined;
  /** Target post identifier. */
  postId: string | number;
};

/** Moderation state attached to stored comments. */
export type CommentModerationStatus =
  | 'APPROVED'
  | 'PENDING'
  | 'REJECTED'
  | 'SPAM';

/** Status values returned by comment creation mutations. */
export type CommentMutationStatus =
  | 'FAILED'
  | 'INVALID_AUTHOR'
  | 'INVALID_CONTENT'
  | 'INVALID_EMAIL'
  | 'INVALID_PARENT'
  | 'INVALID_POST_ID'
  | 'NOT_FOUND'
  | 'RATE_LIMITED'
  | 'SERVICE_UNAVAILABLE'
  | 'SUCCESS';

/** Status values returned by comment read operations. */
export type CommentQueryStatus =
  | 'FAILED'
  | 'INVALID_POST_ID'
  | 'NOT_FOUND'
  | 'SERVICE_UNAVAILABLE'
  | 'SUCCESS';

/** Status values returned by content read operations. */
export type ContentQueryStatus =
  /** The operation failed unexpectedly. */
  | 'FAILED'
  /** The supplied post identifier was invalid. */
  | 'INVALID_POST_ID'
  /** The supplied scope identifiers were invalid or exceeded validation limits. */
  | 'INVALID_SCOPE_IDS'
  /** The requested resource could not be found. */
  | 'NOT_FOUND'
  /** The backing service or repository is temporarily unavailable. */
  | 'SERVICE_UNAVAILABLE'
  /** The operation completed successfully. */
  | 'SUCCESS';

/** Supported content source values. */
export type ContentSource =
  | 'blog'
  | 'medium';

/** Status values returned by newsletter mutations. */
export type NewsletterMutationStatus =
  /** The server configuration is incomplete or invalid for this workflow. */
  | 'CONFIG_ERROR'
  /** The supplied link or token has expired. */
  | 'EXPIRED'
  /** The operation failed unexpectedly. */
  | 'FAILED'
  /** The supplied email address was invalid. */
  | 'INVALID_EMAIL'
  /** The supplied confirmation or unsubscribe link was invalid. */
  | 'INVALID_LINK'
  /** The caller exceeded the allowed request rate. */
  | 'RATE_LIMITED'
  /** The backing service or repository is temporarily unavailable. */
  | 'SERVICE_UNAVAILABLE'
  /** The operation completed successfully. */
  | 'SUCCESS'
  /** The request could not be completed because of an unexpected internal condition. */
  | 'UNKNOWN_ERROR';

/** Input payload used when resending a newsletter confirmation email. */
export type NewsletterResendInput = {
  /** Subscriber email address. */
  email: string;
  /** Locale used for the resend response and email copy. */
  locale: string;
  /** Consent checkbox value captured from the client form. */
  terms: boolean;
};

/** Input payload used when a visitor subscribes to the newsletter. */
export type NewsletterSubscribeInput = {
  /** Subscriber email address. */
  email: string;
  /** Optional frontend form name for analytics and diagnostics. */
  formName?: string | null | undefined;
  /** Locale used for content and outgoing email copy. */
  locale: string;
  /** Optional tags attached to the subscription source. */
  tags?: Array<string> | null | undefined;
  /** Consent checkbox value captured from the client form. */
  terms: boolean;
};

/** Status values returned by post metric mutations. */
export type PostMetricStatus =
  /** The operation failed unexpectedly. */
  | 'FAILED'
  /** The supplied post identifier was invalid. */
  | 'INVALID_POST_ID'
  /** The backing service or repository is temporarily unavailable. */
  | 'SERVICE_UNAVAILABLE'
  /** The operation completed successfully. */
  | 'SUCCESS';

/** Pagination and filtering controls for the posts query. */
export type PostsQueryInput = {
  /** One-based page index. Values below 1 fall back to the default page. */
  page?: number | null | undefined;
  /** Optional list of post, topic, or category scope identifiers used to constrain the result set. */
  scopeIds?: Array<string | number> | null | undefined;
  /** Number of posts to return for the current page. */
  size?: number | null | undefined;
  /** Published date sort direction for the result set. */
  sort?: SortOrder | null | undefined;
};

/** Supported published date sort directions. */
export type SortOrder =
  /** Ascending order. */
  | 'ASC'
  /** Descending order. */
  | 'DESC';

export type PostsQueryVariables = Exact<{
  locale: string;
  input?: PostsQueryInput | null | undefined;
}>;


export type PostsQuery = { posts: { status: ContentQueryStatus, locale: string, total: number, page: number, size: number, sort: SortOrder | null, engagement: Array<{ postId: string, likes: number, hits: number, comments: number }>, nodes: Array<{ id: string, slug: string, title: string, publishedDate: string, updatedDate: string | null, summary: string, searchText: string, thumbnail: string | null, readingTime: number, source: ContentSource | null, url: string | null, category: { id: string, name: string, color: string, icon: string | null } | null, topics: Array<{ id: string, name: string, color: string, link: string | null }> | null }> } };

export type PostQueryVariables = Exact<{
  locale: string;
  id: string | number;
}>;


export type PostQuery = { post: { status: ContentQueryStatus, locale: string, node: { id: string, slug: string, title: string, publishedDate: string, updatedDate: string | null, summary: string, searchText: string, thumbnail: string | null, readingTime: number, source: ContentSource | null, url: string | null, category: { id: string, name: string, color: string, icon: string | null } | null, topics: Array<{ id: string, name: string, color: string, link: string | null }> | null } | null, engagement: { postId: string, likes: number, hits: number, comments: number } | null } };

export type CommentsQueryVariables = Exact<{
  postId: string | number;
}>;


export type CommentsQuery = { comments: { status: CommentQueryStatus, postId: string, total: number, threads: Array<{ root: { id: string, parentId: string | null, authorName: string, avatarUrl: string | null, content: string, createdAt: string }, replies: Array<{ id: string, parentId: string | null, authorName: string, avatarUrl: string | null, content: string, createdAt: string }> }> } };

export type PostRuntimeQueryVariables = Exact<{
  locale: string;
  id: string | number;
}>;


export type PostRuntimeQuery = { post: { status: ContentQueryStatus, engagement: { postId: string, likes: number, hits: number, comments: number } | null }, comments: { status: CommentQueryStatus, postId: string, total: number, threads: Array<{ root: { id: string, parentId: string | null, authorName: string, avatarUrl: string | null, content: string, createdAt: string }, replies: Array<{ id: string, parentId: string | null, authorName: string, avatarUrl: string | null, content: string, createdAt: string }> }> } };

export type IncrementPostLikeMutationVariables = Exact<{
  postId: string | number;
}>;


export type IncrementPostLikeMutation = { incrementPostLike: { status: PostMetricStatus, postId: string, likes: number | null, hits: number | null } };

export type IncrementPostHitMutationVariables = Exact<{
  postId: string | number;
}>;


export type IncrementPostHitMutation = { incrementPostHit: { status: PostMetricStatus, postId: string, likes: number | null, hits: number | null } };

export type AddCommentMutationVariables = Exact<{
  input: AddCommentInput;
}>;


export type AddCommentMutation = { addComment: { status: CommentMutationStatus, postId: string, moderationStatus: CommentModerationStatus | null } };

export type SubscribeNewsletterMutationVariables = Exact<{
  input: NewsletterSubscribeInput;
}>;


export type SubscribeNewsletterMutation = { subscribeNewsletter: { status: NewsletterMutationStatus, forwardTo: string | null } };

export type ResendNewsletterConfirmationMutationVariables = Exact<{
  input: NewsletterResendInput;
}>;


export type ResendNewsletterConfirmationMutation = { resendNewsletterConfirmation: { status: NewsletterMutationStatus, forwardTo: string | null } };

export type ConfirmNewsletterSubscriptionMutationVariables = Exact<{
  token: string;
}>;


export type ConfirmNewsletterSubscriptionMutation = { confirmNewsletterSubscription: { status: NewsletterMutationStatus, forwardTo: string | null } };

export type UnsubscribeNewsletterMutationVariables = Exact<{
  token: string;
}>;


export type UnsubscribeNewsletterMutation = { unsubscribeNewsletter: { status: NewsletterMutationStatus, forwardTo: string | null } };


export const PostsQueryDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"PostsQuery"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"locale"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"Locale"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"PostsQueryInput"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"posts"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"locale"},"value":{"kind":"Variable","name":{"kind":"Name","value":"locale"}}},{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"locale"}},{"kind":"Field","name":{"kind":"Name","value":"total"}},{"kind":"Field","name":{"kind":"Name","value":"page"}},{"kind":"Field","name":{"kind":"Name","value":"size"}},{"kind":"Field","name":{"kind":"Name","value":"sort"}},{"kind":"Field","name":{"kind":"Name","value":"engagement"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"postId"}},{"kind":"Field","name":{"kind":"Name","value":"likes"}},{"kind":"Field","name":{"kind":"Name","value":"hits"}},{"kind":"Field","name":{"kind":"Name","value":"comments"}}]}},{"kind":"Field","name":{"kind":"Name","value":"nodes"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"slug"}},{"kind":"Field","name":{"kind":"Name","value":"title"}},{"kind":"Field","name":{"kind":"Name","value":"category"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"color"}},{"kind":"Field","name":{"kind":"Name","value":"icon"}}]}},{"kind":"Field","name":{"kind":"Name","value":"publishedDate"}},{"kind":"Field","name":{"kind":"Name","value":"updatedDate"}},{"kind":"Field","name":{"kind":"Name","value":"summary"}},{"kind":"Field","name":{"kind":"Name","value":"searchText"}},{"kind":"Field","name":{"kind":"Name","value":"thumbnail"}},{"kind":"Field","name":{"kind":"Name","value":"readingTime"}},{"kind":"Field","name":{"kind":"Name","value":"source"}},{"kind":"Field","name":{"kind":"Name","value":"url"}},{"kind":"Field","name":{"kind":"Name","value":"topics"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"color"}},{"kind":"Field","name":{"kind":"Name","value":"link"}}]}}]}}]}}]}}]} as unknown as DocumentNode<PostsQuery, PostsQueryVariables>;
export const PostQueryDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"PostQuery"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"locale"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"Locale"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"post"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"locale"},"value":{"kind":"Variable","name":{"kind":"Name","value":"locale"}}},{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"locale"}},{"kind":"Field","name":{"kind":"Name","value":"node"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"slug"}},{"kind":"Field","name":{"kind":"Name","value":"title"}},{"kind":"Field","name":{"kind":"Name","value":"category"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"color"}},{"kind":"Field","name":{"kind":"Name","value":"icon"}}]}},{"kind":"Field","name":{"kind":"Name","value":"publishedDate"}},{"kind":"Field","name":{"kind":"Name","value":"updatedDate"}},{"kind":"Field","name":{"kind":"Name","value":"summary"}},{"kind":"Field","name":{"kind":"Name","value":"searchText"}},{"kind":"Field","name":{"kind":"Name","value":"thumbnail"}},{"kind":"Field","name":{"kind":"Name","value":"readingTime"}},{"kind":"Field","name":{"kind":"Name","value":"source"}},{"kind":"Field","name":{"kind":"Name","value":"url"}},{"kind":"Field","name":{"kind":"Name","value":"topics"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"color"}},{"kind":"Field","name":{"kind":"Name","value":"link"}}]}}]}},{"kind":"Field","name":{"kind":"Name","value":"engagement"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"postId"}},{"kind":"Field","name":{"kind":"Name","value":"likes"}},{"kind":"Field","name":{"kind":"Name","value":"hits"}},{"kind":"Field","name":{"kind":"Name","value":"comments"}}]}}]}}]}}]} as unknown as DocumentNode<PostQuery, PostQueryVariables>;
export const CommentsQueryDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"CommentsQuery"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"postId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"comments"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"postId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"postId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"postId"}},{"kind":"Field","name":{"kind":"Name","value":"total"}},{"kind":"Field","name":{"kind":"Name","value":"threads"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"root"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"parentId"}},{"kind":"Field","name":{"kind":"Name","value":"authorName"}},{"kind":"Field","name":{"kind":"Name","value":"avatarUrl"}},{"kind":"Field","name":{"kind":"Name","value":"content"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}}]}},{"kind":"Field","name":{"kind":"Name","value":"replies"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"parentId"}},{"kind":"Field","name":{"kind":"Name","value":"authorName"}},{"kind":"Field","name":{"kind":"Name","value":"avatarUrl"}},{"kind":"Field","name":{"kind":"Name","value":"content"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}}]}}]}}]}}]}}]} as unknown as DocumentNode<CommentsQuery, CommentsQueryVariables>;
export const PostRuntimeQueryDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"PostRuntimeQuery"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"locale"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"Locale"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"post"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"locale"},"value":{"kind":"Variable","name":{"kind":"Name","value":"locale"}}},{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"engagement"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"postId"}},{"kind":"Field","name":{"kind":"Name","value":"likes"}},{"kind":"Field","name":{"kind":"Name","value":"hits"}},{"kind":"Field","name":{"kind":"Name","value":"comments"}}]}}]}},{"kind":"Field","name":{"kind":"Name","value":"comments"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"postId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"postId"}},{"kind":"Field","name":{"kind":"Name","value":"total"}},{"kind":"Field","name":{"kind":"Name","value":"threads"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"root"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"parentId"}},{"kind":"Field","name":{"kind":"Name","value":"authorName"}},{"kind":"Field","name":{"kind":"Name","value":"avatarUrl"}},{"kind":"Field","name":{"kind":"Name","value":"content"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}}]}},{"kind":"Field","name":{"kind":"Name","value":"replies"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"parentId"}},{"kind":"Field","name":{"kind":"Name","value":"authorName"}},{"kind":"Field","name":{"kind":"Name","value":"avatarUrl"}},{"kind":"Field","name":{"kind":"Name","value":"content"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}}]}}]}}]}}]}}]} as unknown as DocumentNode<PostRuntimeQuery, PostRuntimeQueryVariables>;
export const IncrementPostLikeMutationDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"IncrementPostLikeMutation"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"postId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"incrementPostLike"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"postId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"postId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"postId"}},{"kind":"Field","name":{"kind":"Name","value":"likes"}},{"kind":"Field","name":{"kind":"Name","value":"hits"}}]}}]}}]} as unknown as DocumentNode<IncrementPostLikeMutation, IncrementPostLikeMutationVariables>;
export const IncrementPostHitMutationDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"IncrementPostHitMutation"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"postId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"incrementPostHit"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"postId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"postId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"postId"}},{"kind":"Field","name":{"kind":"Name","value":"likes"}},{"kind":"Field","name":{"kind":"Name","value":"hits"}}]}}]}}]} as unknown as DocumentNode<IncrementPostHitMutation, IncrementPostHitMutationVariables>;
export const AddCommentMutationDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"AddCommentMutation"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"AddCommentInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"addComment"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"postId"}},{"kind":"Field","name":{"kind":"Name","value":"moderationStatus"}}]}}]}}]} as unknown as DocumentNode<AddCommentMutation, AddCommentMutationVariables>;
export const SubscribeNewsletterMutationDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"SubscribeNewsletterMutation"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"NewsletterSubscribeInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"subscribeNewsletter"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"forwardTo"}}]}}]}}]} as unknown as DocumentNode<SubscribeNewsletterMutation, SubscribeNewsletterMutationVariables>;
export const ResendNewsletterConfirmationMutationDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"ResendNewsletterConfirmationMutation"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"NewsletterResendInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"resendNewsletterConfirmation"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"forwardTo"}}]}}]}}]} as unknown as DocumentNode<ResendNewsletterConfirmationMutation, ResendNewsletterConfirmationMutationVariables>;
export const ConfirmNewsletterSubscriptionMutationDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"ConfirmNewsletterSubscriptionMutation"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"token"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"confirmNewsletterSubscription"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"token"},"value":{"kind":"Variable","name":{"kind":"Name","value":"token"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"forwardTo"}}]}}]}}]} as unknown as DocumentNode<ConfirmNewsletterSubscriptionMutation, ConfirmNewsletterSubscriptionMutationVariables>;
export const UnsubscribeNewsletterMutationDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"UnsubscribeNewsletterMutation"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"token"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"unsubscribeNewsletter"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"token"},"value":{"kind":"Variable","name":{"kind":"Name","value":"token"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"forwardTo"}}]}}]}}]} as unknown as DocumentNode<UnsubscribeNewsletterMutation, UnsubscribeNewsletterMutationVariables>;