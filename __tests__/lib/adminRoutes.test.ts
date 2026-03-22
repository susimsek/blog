import {
  ADMIN_ROUTES,
  buildAdminContentPostDetailHash,
  buildAdminContentPostDetailHref,
  buildAdminContentPostDetailRoute,
  withAdminLocalePath,
} from '@/lib/adminRoutes';

describe('adminRoutes', () => {
  it('prefixes admin routes with the locale', () => {
    expect(withAdminLocalePath('en', ADMIN_ROUTES.login)).toBe('/en/admin/login');
    expect(withAdminLocalePath('tr', ADMIN_ROUTES.forgotPassword)).toBe('/tr/admin/forgot-password');
  });

  it('builds encoded admin post detail routes', () => {
    expect(buildAdminContentPostDetailRoute(' EN ', 'post/with space')).toBe(
      '/admin/settings/content/posts/en/post%2Fwith%20space',
    );
    expect(buildAdminContentPostDetailHash('content')).toBe('#content');
    expect(buildAdminContentPostDetailHref(' EN ', 'post/with space', 'comments')).toBe(
      '/admin/settings/content/posts/en/post%2Fwith%20space#comments',
    );
  });
});
