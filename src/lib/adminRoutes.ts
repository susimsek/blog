export const ADMIN_ROUTES = {
  root: '/admin',
  login: '/admin/login',
  forgotPassword: '/admin/forgot-password',
  resetPassword: '/admin/reset-password',
  settings: {
    root: '/admin/settings',
    profile: '/admin/settings/profile',
    account: '/admin/settings/account',
    email: '/admin/settings/email',
    appearance: '/admin/settings/appearance',
    sessions: '/admin/settings/sessions',
    newsletter: '/admin/settings/newsletter',
    newsletterSubscribers: '/admin/settings/newsletter/subscribers',
    comments: '/admin/settings/comments',
    errors: '/admin/settings/errors',
    content: '/admin/settings/content',
    security: '/admin/settings/security',
    passwordLegacy: '/admin/settings/password',
  },
  legacy: {
    account: '/admin/account',
    changePassword: '/admin/change-password',
  },
} as const;

export const withAdminLocalePath = (locale: string, route: string) => `/${locale}${route}`;

export const buildAdminContentPostDetailRoute = (postLocale: string, postId: string) =>
  `${ADMIN_ROUTES.settings.content}/posts/${encodeURIComponent(postLocale.trim().toLowerCase())}/${encodeURIComponent(postId)}`;
