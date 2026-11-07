import React from 'react';
import AdminSettingsAccountRoute, {
  generateMetadata as accountMetadata,
} from '@/app/(default)/admin/settings/account/page';
import AdminSettingsAppearanceRoute, {
  generateMetadata as appearanceMetadata,
} from '@/app/(default)/admin/settings/appearance/page';
import AdminSettingsCommentsRoute, {
  generateMetadata as commentsMetadata,
} from '@/app/(default)/admin/settings/comments/page';
import AdminSettingsContentRoute, {
  generateMetadata as contentMetadata,
} from '@/app/(default)/admin/settings/content/page';
import AdminSettingsEmailRoute, { generateMetadata as emailMetadata } from '@/app/(default)/admin/settings/email/page';
import AdminSettingsErrorsRoute, {
  generateMetadata as errorsMetadata,
} from '@/app/(default)/admin/settings/errors/page';
import AdminSettingsNewsletterRoute, {
  generateMetadata as newsletterMetadata,
} from '@/app/(default)/admin/settings/newsletter/page';
import AdminSettingsSubscribersRoute, {
  generateMetadata as subscribersMetadata,
} from '@/app/(default)/admin/settings/newsletter/subscribers/page';
import AdminSettingsProfileRoute, {
  generateMetadata as profileMetadata,
} from '@/app/(default)/admin/settings/profile/page';
import AdminSettingsSecurityRoute, {
  generateMetadata as securityMetadata,
} from '@/app/(default)/admin/settings/security/page';
import AdminSettingsSessionsRoute, {
  generateMetadata as sessionsMetadata,
} from '@/app/(default)/admin/settings/sessions/page';
import AdminAccountRedirectRoute, {
  generateMetadata as accountRedirectMetadata,
} from '@/app/(default)/admin/account/page';
import AdminChangePasswordRoute, {
  generateMetadata as changePasswordMetadata,
} from '@/app/(default)/admin/change-password/page';
import AdminDashboardRoute, { generateMetadata as dashboardMetadata } from '@/app/(default)/admin/page';
import AdminEmailChangeRoute, {
  generateMetadata as emailChangeMetadata,
} from '@/app/(default)/admin/email-change/page';
import AdminForgotPasswordRoute, {
  generateMetadata as forgotPasswordMetadata,
} from '@/app/(default)/admin/forgot-password/page';
import AdminLoginRoute, { generateMetadata as loginMetadata } from '@/app/(default)/admin/login/page';
import AdminResetPasswordRoute, {
  generateMetadata as resetPasswordMetadata,
} from '@/app/(default)/admin/reset-password/page';
import AdminSettingsIndexRoute, {
  generateMetadata as settingsIndexMetadata,
} from '@/app/(default)/admin/settings/page';
import AdminSettingsPasswordRoute, {
  generateMetadata as settingsPasswordMetadata,
} from '@/app/(default)/admin/settings/password/page';
import LocalizedAdminSettingsAccountRoute, {
  generateMetadata as localizedAccountMetadata,
} from '@/app/(localized)/[locale]/admin/settings/account/page';
import LocalizedAdminSettingsAppearanceRoute, {
  generateMetadata as localizedAppearanceMetadata,
} from '@/app/(localized)/[locale]/admin/settings/appearance/page';
import LocalizedAdminSettingsCommentsRoute, {
  generateMetadata as localizedCommentsMetadata,
} from '@/app/(localized)/[locale]/admin/settings/comments/page';
import LocalizedAdminSettingsContentRoute, {
  generateMetadata as localizedContentMetadata,
} from '@/app/(localized)/[locale]/admin/settings/content/page';
import LocalizedAdminSettingsEmailRoute, {
  generateMetadata as localizedEmailMetadata,
} from '@/app/(localized)/[locale]/admin/settings/email/page';
import LocalizedAdminSettingsErrorsRoute, {
  generateMetadata as localizedErrorsMetadata,
} from '@/app/(localized)/[locale]/admin/settings/errors/page';
import LocalizedAdminSettingsNewsletterRoute, {
  generateMetadata as localizedNewsletterMetadata,
} from '@/app/(localized)/[locale]/admin/settings/newsletter/page';
import LocalizedAdminSettingsSubscribersRoute, {
  generateMetadata as localizedSubscribersMetadata,
} from '@/app/(localized)/[locale]/admin/settings/newsletter/subscribers/page';
import LocalizedAdminSettingsProfileRoute, {
  generateMetadata as localizedProfileMetadata,
} from '@/app/(localized)/[locale]/admin/settings/profile/page';
import LocalizedAdminSettingsSecurityRoute, {
  generateMetadata as localizedSecurityMetadata,
} from '@/app/(localized)/[locale]/admin/settings/security/page';
import LocalizedAdminSettingsSessionsRoute, {
  generateMetadata as localizedSessionsMetadata,
} from '@/app/(localized)/[locale]/admin/settings/sessions/page';
import LocalizedAdminAccountRedirectRoute, {
  generateMetadata as localizedAccountRedirectMetadata,
} from '@/app/(localized)/[locale]/admin/account/page';
import LocalizedAdminChangePasswordRoute, {
  generateMetadata as localizedChangePasswordMetadata,
} from '@/app/(localized)/[locale]/admin/change-password/page';
import LocalizedAdminDashboardRoute, {
  generateMetadata as localizedDashboardMetadata,
} from '@/app/(localized)/[locale]/admin/page';
import LocalizedAdminEmailChangeRoute, {
  generateMetadata as localizedEmailChangeMetadata,
} from '@/app/(localized)/[locale]/admin/email-change/page';
import LocalizedAdminForgotPasswordRoute, {
  generateMetadata as localizedForgotPasswordMetadata,
} from '@/app/(localized)/[locale]/admin/forgot-password/page';
import LocalizedAdminLoginRoute, {
  generateMetadata as localizedLoginMetadata,
} from '@/app/(localized)/[locale]/admin/login/page';
import LocalizedAdminResetPasswordRoute, {
  generateMetadata as localizedResetPasswordMetadata,
} from '@/app/(localized)/[locale]/admin/reset-password/page';
import LocalizedAdminSettingsIndexRoute, {
  generateMetadata as localizedSettingsIndexMetadata,
} from '@/app/(localized)/[locale]/admin/settings/page';
import LocalizedAdminSettingsPasswordRoute, {
  generateMetadata as localizedSettingsPasswordMetadata,
} from '@/app/(localized)/[locale]/admin/settings/password/page';

const mockRedirect = jest.fn((path: string): never => {
  throw new Error(`redirect:${path}`);
});

jest.mock('next/navigation', () => ({
  redirect: (path: string) => mockRedirect(path),
}));

jest.mock('@/i18n/server', () => ({
  getServerTranslator: jest.fn(async () => ({ t: (key: string) => key })),
  loadLocaleResources: jest.fn(async () => ({})),
}));

jest.mock('@/lib/metadata', () => ({
  buildPageMetadata: jest.fn((metadata: unknown) => metadata),
}));

jest.mock('@/i18n/RouteI18nProvider', () => ({
  __esModule: true,
  default: ({ children }: { children: React.ReactNode }) => children,
}));

jest.mock('@/views/AdminAccountPage', () => ({
  __esModule: true,
  default: () => null,
}));

jest.mock('@/views/AdminDashboardPage', () => ({ __esModule: true, default: () => null }));
jest.mock('@/views/AdminEmailChangePage', () => ({ __esModule: true, default: () => null }));
jest.mock('@/views/AdminForgotPasswordPage', () => ({ __esModule: true, default: () => null }));
jest.mock('@/views/AdminLoginPage', () => ({ __esModule: true, default: () => null }));
jest.mock('@/views/AdminResetPasswordPage', () => ({ __esModule: true, default: () => null }));

type RouteArgs = {
  params: Promise<Record<string, string>>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};
type DefaultAdminRoute = {
  default: (args: RouteArgs) => Promise<React.ReactNode>;
  generateMetadata: (args: RouteArgs) => Promise<{
    locale: string;
    path: string;
    robots: { index: boolean; follow: boolean };
  }>;
  section: string;
};

const adminRoutes = [
  { default: AdminSettingsAccountRoute, generateMetadata: accountMetadata, section: 'account' },
  { default: AdminSettingsAppearanceRoute, generateMetadata: appearanceMetadata, section: 'appearance' },
  { default: AdminSettingsCommentsRoute, generateMetadata: commentsMetadata, section: 'comments' },
  { default: AdminSettingsContentRoute, generateMetadata: contentMetadata, section: 'content' },
  { default: AdminSettingsEmailRoute, generateMetadata: emailMetadata, section: 'email' },
  { default: AdminSettingsErrorsRoute, generateMetadata: errorsMetadata, section: 'errors' },
  { default: AdminSettingsNewsletterRoute, generateMetadata: newsletterMetadata, section: 'newsletter' },
  {
    default: AdminSettingsSubscribersRoute,
    generateMetadata: subscribersMetadata,
    section: 'newsletterSubscribers',
  },
  { default: AdminSettingsProfileRoute, generateMetadata: profileMetadata, section: 'profile' },
  { default: AdminSettingsSecurityRoute, generateMetadata: securityMetadata, section: 'security' },
  { default: AdminSettingsSessionsRoute, generateMetadata: sessionsMetadata, section: 'sessions' },
] as unknown as DefaultAdminRoute[];

describe('default-locale admin settings routes', () => {
  beforeEach(() => mockRedirect.mockClear());

  it('builds private metadata and maps each route to its settings section', async () => {
    for (const route of adminRoutes) {
      const args = {
        params: Promise.resolve({ locale: 'tr' }),
        searchParams: Promise.resolve({}),
      };
      const metadata = await route.generateMetadata(args);
      expect(metadata).toMatchObject({
        locale: 'en',
        path: expect.stringContaining('admin/settings'),
        robots: { index: false, follow: false },
      });

      const element = await route.default(args);
      expect(React.isValidElement(element)).toBe(true);
      const providerElement = element as React.ReactElement<{ children: React.ReactElement<{ section: string }> }>;
      expect(providerElement.props.children.props.section).toBe(route.section);
    }
  });

  it('covers default admin page wrappers and legacy redirects', async () => {
    const args = {
      params: Promise.resolve({ locale: 'tr' }),
      searchParams: Promise.resolve({}),
    };
    const renderingRoutes = [
      [AdminDashboardRoute, dashboardMetadata],
      [AdminEmailChangeRoute, emailChangeMetadata],
      [AdminForgotPasswordRoute, forgotPasswordMetadata],
      [AdminLoginRoute, loginMetadata],
      [AdminResetPasswordRoute, resetPasswordMetadata],
    ] as const;

    for (const [route, generateRouteMetadata] of renderingRoutes) {
      const metadata = await generateRouteMetadata(args);
      expect(metadata).toMatchObject({ locale: 'en', robots: { index: false, follow: false } });
      expect(React.isValidElement(await route(args))).toBe(true);
    }

    const redirectRoutes = [
      [AdminAccountRedirectRoute, accountRedirectMetadata],
      [AdminChangePasswordRoute, changePasswordMetadata],
      [AdminSettingsIndexRoute, settingsIndexMetadata],
      [AdminSettingsPasswordRoute, settingsPasswordMetadata],
    ] as const;

    for (const [route, generateRouteMetadata] of redirectRoutes) {
      const metadata = await generateRouteMetadata(args);
      expect(metadata).toMatchObject({ locale: 'en', robots: { index: false, follow: false } });
      await expect(route(args)).rejects.toThrow('redirect:');
    }

    expect(mockRedirect).toHaveBeenCalledTimes(4);
  });

  it('builds localized admin routes for the requested locale', async () => {
    const args = {
      params: Promise.resolve({ locale: 'tr' }),
      searchParams: Promise.resolve({}),
    };
    const settingsRoutes = [
      { default: LocalizedAdminSettingsAccountRoute, generateMetadata: localizedAccountMetadata, section: 'account' },
      {
        default: LocalizedAdminSettingsAppearanceRoute,
        generateMetadata: localizedAppearanceMetadata,
        section: 'appearance',
      },
      {
        default: LocalizedAdminSettingsCommentsRoute,
        generateMetadata: localizedCommentsMetadata,
        section: 'comments',
      },
      { default: LocalizedAdminSettingsContentRoute, generateMetadata: localizedContentMetadata, section: 'content' },
      { default: LocalizedAdminSettingsEmailRoute, generateMetadata: localizedEmailMetadata, section: 'email' },
      { default: LocalizedAdminSettingsErrorsRoute, generateMetadata: localizedErrorsMetadata, section: 'errors' },
      {
        default: LocalizedAdminSettingsNewsletterRoute,
        generateMetadata: localizedNewsletterMetadata,
        section: 'newsletter',
      },
      {
        default: LocalizedAdminSettingsSubscribersRoute,
        generateMetadata: localizedSubscribersMetadata,
        section: 'newsletterSubscribers',
      },
      { default: LocalizedAdminSettingsProfileRoute, generateMetadata: localizedProfileMetadata, section: 'profile' },
      {
        default: LocalizedAdminSettingsSecurityRoute,
        generateMetadata: localizedSecurityMetadata,
        section: 'security',
      },
      {
        default: LocalizedAdminSettingsSessionsRoute,
        generateMetadata: localizedSessionsMetadata,
        section: 'sessions',
      },
    ] as unknown as DefaultAdminRoute[];

    for (const route of settingsRoutes) {
      const metadata = await route.generateMetadata(args);
      expect(metadata).toMatchObject({ locale: 'tr', robots: { index: false, follow: false } });
      const element = (await route.default(args)) as React.ReactElement<{
        children: React.ReactElement<{ section: string }>;
      }>;
      expect(element.props.children.props.section).toBe(route.section);
    }

    const renderingRoutes = [
      [LocalizedAdminDashboardRoute, localizedDashboardMetadata],
      [LocalizedAdminEmailChangeRoute, localizedEmailChangeMetadata],
      [LocalizedAdminForgotPasswordRoute, localizedForgotPasswordMetadata],
      [LocalizedAdminLoginRoute, localizedLoginMetadata],
      [LocalizedAdminResetPasswordRoute, localizedResetPasswordMetadata],
    ] as const;
    for (const [route, generateRouteMetadata] of renderingRoutes) {
      expect(await generateRouteMetadata(args)).toMatchObject({ locale: 'tr' });
      expect(React.isValidElement(await route(args))).toBe(true);
    }

    const redirectRoutes = [
      [LocalizedAdminAccountRedirectRoute, localizedAccountRedirectMetadata],
      [LocalizedAdminChangePasswordRoute, localizedChangePasswordMetadata],
      [LocalizedAdminSettingsIndexRoute, localizedSettingsIndexMetadata],
      [LocalizedAdminSettingsPasswordRoute, localizedSettingsPasswordMetadata],
    ] as const;
    for (const [route, generateRouteMetadata] of redirectRoutes) {
      expect(await generateRouteMetadata(args)).toMatchObject({ locale: 'tr' });
      await expect(route(args)).rejects.toThrow('redirect:');
    }
    expect(mockRedirect).toHaveBeenCalledTimes(4);
  });
});
