import type { Page, Route } from '@playwright/test';

export const ADMIN_USER = {
  id: 'admin-e2e',
  name: 'E2E Admin',
  username: 'e2e-admin',
  avatarUrl: null,
  email: 'admin@example.com',
  pendingEmail: null,
  pendingEmailExpiresAt: null,
  googleLinked: false,
  googleEmail: null,
  googleLinkedAt: null,
  githubLinked: false,
  githubEmail: null,
  githubLinkedAt: null,
  roles: ['ADMIN'],
};

export const ADMIN_SESSION_STORAGE_KEY = 'admin.session.profile.v1';

export type ApiMockOptions = {
  adminLoginSucceeds?: boolean;
  comments?: Array<Record<string, unknown>>;
  newsletterStatus?: string;
};

export type ApiMockState = {
  calls: Array<{ endpoint: string; operation: string; variables: Record<string, unknown> }>;
  authenticated: boolean;
};

const comment = {
  id: 'comment-e2e',
  postId: 'captain-tsubasa-2-world-fighters',
  postTitle: 'Captain Tsubasa 2: World Fighters',
  parentId: null,
  authorName: 'Reader Example',
  authorEmail: 'reader@example.com',
  content: 'An E2E moderation comment.',
  status: 'PENDING',
  createdAt: '2026-01-01T12:00:00.000Z',
  updatedAt: '2026-01-01T12:00:00.000Z',
};

const adminPost = {
  locale: 'en',
  id: 'captain-tsubasa-2-world-fighters',
  title: 'Captain Tsubasa 2: World Fighters',
  summary: 'E2E fixture post summary.',
  content: '# E2E content\n\nFixture body for editor workflow.',
  contentMode: 'MARKDOWN',
  thumbnail: '/images/captain-tsubasa-2-world-fighters-thumbnail.webp',
  source: 'blog',
  publishedDate: '2026-02-27',
  updatedDate: null,
  categoryId: 'gaming',
  categoryName: 'Gaming',
  topicIds: ['captain-tsubasa'],
  topicNames: ['Captain Tsubasa'],
  readingTimeMin: 4,
  status: 'PUBLISHED',
  scheduledAt: null,
  contentUpdatedAt: null,
  updatedAt: null,
  revisionCount: 0,
  latestRevisionAt: null,
  viewCount: 0,
  likeCount: 0,
  commentCount: 1,
};

const dashboard = {
  totalPosts: 46,
  totalSubscribers: 8,
  contentHealth: {
    localePairCoverage: 100,
    missingTranslations: 0,
    missingThumbnails: 0,
    latestUpdatedPosts: [],
    dominantCategory: null,
  },
  topViewedPosts: [],
  topLikedPosts: [],
};

const emptyPage = { items: [], total: 0, page: 1, size: 10 };

const operationFor = (body: { operationName?: string; query?: string }) =>
  body.operationName ?? body.query?.match(/(?:query|mutation)\s+(\w+)/)?.[1] ?? '';

const rootFieldFor = (query = '') =>
  query
    .match(/\)\s*\{\s*(\w+)|\{\s*(\w+)/)
    ?.slice(1)
    .find(Boolean) ?? '';

const graphqlResponse = async (route: Route, data: Record<string, unknown>) =>
  route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ data }) });

export async function installApiMocks(page: Page, options: ApiMockOptions = {}): Promise<ApiMockState> {
  const state: ApiMockState = { calls: [], authenticated: false };
  const comments = options.comments ?? [];
  const newsletterStatus = options.newsletterStatus ?? 'SUCCESS';

  // Register the fallback first: Playwright evaluates route handlers in reverse
  // registration order, so the specific handlers below must get first refusal.
  await page.route('**/api/**', route =>
    route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ success: true }) }),
  );

  await page.route('**/api/reader-auth/session', route =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ authenticated: false, providers: { google: true, github: true } }),
    }),
  );
  await page.route('**/api/reader-auth/logout', route =>
    route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ success: true }) }),
  );

  await page.route(
    url => ['/graphql', '/api/graphql', '/api/admin/graphql'].includes(url.pathname),
    async route => {
      const endpoint = new URL(route.request().url()).pathname;
      const body = route.request().postDataJSON() as {
        operationName?: string;
        query?: string;
        variables?: Record<string, unknown>;
      };
      const operation = operationFor(body);
      const root = rootFieldFor(body.query);
      const variables = body.variables ?? {};
      state.calls.push({ endpoint, operation, variables });

      if (endpoint !== '/api/admin/graphql') {
        if (root === 'posts') {
          return graphqlResponse(route, {
            posts: {
              status: 'SUCCESS',
              locale: 'EN',
              total: 0,
              page: 1,
              size: 10,
              sort: 'PUBLISHED_DESC',
              engagement: [],
              nodes: [],
            },
          });
        }
        if (root === 'post') {
          return graphqlResponse(route, {
            post: {
              status: 'SUCCESS',
              locale: 'EN',
              node: null,
              engagement: { postId: 'captain-tsubasa-2-world-fighters', likes: 0, hits: 0, comments: comments.length },
            },
          });
        }
        if (root === 'comments') {
          return graphqlResponse(route, {
            comments: {
              status: 'SUCCESS',
              postId: 'captain-tsubasa-2-world-fighters',
              total: comments.length,
              threads: comments,
            },
          });
        }
        if (root === 'addComment') {
          return graphqlResponse(route, {
            addComment: { status: 'SUCCESS', moderationStatus: 'PENDING', postId: 'captain-tsubasa-2-world-fighters' },
          });
        }
        if (root === 'incrementPostLike') {
          return graphqlResponse(route, {
            incrementPostLike: { status: 'SUCCESS', postId: 'captain-tsubasa-2-world-fighters', likes: 1, hits: 0 },
          });
        }
        if (root === 'incrementPostHit') {
          return graphqlResponse(route, {
            incrementPostHit: { status: 'SUCCESS', postId: 'captain-tsubasa-2-world-fighters', likes: 0, hits: 1 },
          });
        }
        if (root === 'subscribeNewsletter') {
          return graphqlResponse(route, { subscribeNewsletter: { status: newsletterStatus, forwardTo: null } });
        }
        if (root === 'resendNewsletterConfirmation') {
          return graphqlResponse(route, {
            resendNewsletterConfirmation: { status: newsletterStatus, forwardTo: null },
          });
        }
        if (root === 'confirmNewsletterSubscription') {
          return graphqlResponse(route, {
            confirmNewsletterSubscription: { status: newsletterStatus, forwardTo: null },
          });
        }
        if (root === 'unsubscribeNewsletter') {
          return graphqlResponse(route, { unsubscribeNewsletter: { status: newsletterStatus, forwardTo: null } });
        }
        return graphqlResponse(route, {});
      }

      if (root === 'me') {
        return graphqlResponse(route, {
          me: { authenticated: state.authenticated, user: state.authenticated ? ADMIN_USER : null },
        });
      }
      if (root === 'googleAuthStatus')
        return graphqlResponse(route, { googleAuthStatus: { enabled: false, loginAvailable: false } });
      if (root === 'githubAuthStatus')
        return graphqlResponse(route, { githubAuthStatus: { enabled: false, loginAvailable: false } });
      if (root === 'login') {
        const success = options.adminLoginSucceeds !== false;
        state.authenticated = success;
        return graphqlResponse(route, { login: { success, user: success ? ADMIN_USER : null } });
      }
      if (root === 'logout') {
        state.authenticated = false;
        return graphqlResponse(route, { logout: { success: true } });
      }
      if (root === 'dashboard') return graphqlResponse(route, { dashboard });
      if (root === 'comments') return graphqlResponse(route, { comments: { ...emptyPage, items: comments } });
      if (root === 'updateCommentStatus') {
        return graphqlResponse(route, {
          updateCommentStatus: {
            ...comment,
            status: String((variables.input as Record<string, unknown> | undefined)?.status ?? 'APPROVED'),
          },
        });
      }
      if (root === 'deleteComment') return graphqlResponse(route, { deleteComment: { success: true } });
      if (root === 'contentPosts') {
        const group = {
          id: adminPost.id,
          source: 'blog',
          preferred: adminPost,
          en: adminPost,
          tr: { ...adminPost, locale: 'tr', title: 'Kaptan Tsubasa 2: World Fighters' },
        };
        return graphqlResponse(route, { contentPosts: { ...emptyPage, items: [group], total: 1 } });
      }
      if (root === 'contentPost') return graphqlResponse(route, { contentPost: adminPost });
      if (root === 'contentPostRevisions') return graphqlResponse(route, { contentPostRevisions: emptyPage });
      if (root === 'contentTopics') return graphqlResponse(route, { contentTopics: [] });
      if (root === 'contentCategories') return graphqlResponse(route, { contentCategories: [] });
      if (root === 'contentTopicsPage') return graphqlResponse(route, { contentTopicsPage: emptyPage });
      if (root === 'contentCategoriesPage') return graphqlResponse(route, { contentCategoriesPage: emptyPage });
      if (root === 'createContentTopic' || root === 'updateContentTopic')
        return graphqlResponse(route, {
          [root]: { ...(variables.input as Record<string, unknown>), updatedAt: '2026-01-01T00:00:00.000Z' },
        });
      if (root === 'createContentCategory' || root === 'updateContentCategory')
        return graphqlResponse(route, {
          [root]: { ...(variables.input as Record<string, unknown>), updatedAt: '2026-01-01T00:00:00.000Z' },
        });
      if (root === 'updateContentPostMetadata' || root === 'updateContentPostContent')
        return graphqlResponse(route, { [root]: { ...adminPost, ...(variables.input as Record<string, unknown>) } });
      if (root === 'deleteContentPost' || root === 'deleteContentTopic' || root === 'deleteContentCategory')
        return graphqlResponse(route, { [root]: { success: true } });
      if (root === 'newsletterSubscribers') return graphqlResponse(route, { newsletterSubscribers: emptyPage });
      if (root === 'newsletterCampaigns') return graphqlResponse(route, { newsletterCampaigns: emptyPage });
      if (root === 'newsletterCampaignFailures')
        return graphqlResponse(route, { newsletterCampaignFailures: emptyPage });
      if (root === 'errorMessages') return graphqlResponse(route, { errorMessages: emptyPage });
      if (root === 'errorMessageAuditLogs') return graphqlResponse(route, { errorMessageAuditLogs: [] });
      if (root === 'activeSessions') return graphqlResponse(route, { activeSessions: [] });
      if (root === 'changeUsername')
        return graphqlResponse(route, { changeUsername: { success: true, user: ADMIN_USER } });
      if (root === 'changeName') return graphqlResponse(route, { changeName: { success: true, user: ADMIN_USER } });
      if (root === 'changeAvatar') return graphqlResponse(route, { changeAvatar: { success: true, user: ADMIN_USER } });
      if (root === 'requestEmailChange')
        return graphqlResponse(route, {
          requestEmailChange: { success: true, pendingEmail: 'new@example.com', expiresAt: '2026-01-02T00:00:00.000Z' },
        });
      if (
        root === 'changePassword' ||
        root === 'revokeSession' ||
        root === 'revokeAllSessions' ||
        root === 'deleteAccount'
      )
        return graphqlResponse(route, { [root]: { success: true } });
      if (root === 'requestPasswordReset') return graphqlResponse(route, { requestPasswordReset: { success: true } });
      if (root === 'validatePasswordResetToken')
        return graphqlResponse(route, { validatePasswordResetToken: { status: 'VALID', locale: 'EN' } });
      if (root === 'confirmPasswordReset')
        return graphqlResponse(route, { confirmPasswordReset: { success: true, locale: 'EN' } });
      if (root === 'confirmEmailChange')
        return graphqlResponse(route, { confirmEmailChange: { status: 'SUCCESS', locale: 'EN' } });

      return graphqlResponse(route, { [root]: { success: true } });
    },
  );

  return state;
}

export async function seedAdminSession(page: Page) {
  await page.addInitScript(({ storageKey, profile }) => localStorage.setItem(storageKey, JSON.stringify(profile)), {
    storageKey: ADMIN_SESSION_STORAGE_KEY,
    profile: ADMIN_USER,
  });
}
