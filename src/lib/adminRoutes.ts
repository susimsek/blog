export const ADMIN_ROUTES = {
  root: '/admin',
  login: '/admin/login',
  settings: {
    root: '/admin/settings',
    profile: '/admin/settings/profile',
    account: '/admin/settings/account',
    appearance: '/admin/settings/appearance',
    sessions: '/admin/settings/sessions',
    newsletter: '/admin/settings/newsletter',
    errors: '/admin/settings/errors',
    security: '/admin/settings/security',
    passwordLegacy: '/admin/settings/password',
  },
  legacy: {
    account: '/admin/account',
    changePassword: '/admin/change-password',
  },
} as const;

export const withAdminLocalePath = (locale: string, route: string) => `/${locale}${route}`;
