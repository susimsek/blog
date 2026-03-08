'use client';

import React from 'react';
import Footer from '@/components/common/Footer';
import Link from '@/components/common/Link';
import LanguageSwitcher from '@/components/i18n/LanguageSwitcher';
import ThemeToggler from '@/components/theme/ThemeToggler';
import VoiceToggler from '@/components/voice/VoiceToggler';
import useBoop from '@/hooks/useBoop';
import useMediaQuery from '@/hooks/useMediaQuery';
import { useParams, usePathname, useRouter } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import Image from 'next/image';
import { SITE_LOGO } from '@/config/constants';
import Navbar from 'react-bootstrap/Navbar';
import Nav from 'react-bootstrap/Nav';
import NavDropdown from 'react-bootstrap/NavDropdown';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { fetchAdminMe, logoutAdmin } from '@/lib/adminApi';
import { withAdminAvatarSize } from '@/lib/adminAvatar';
import { ADMIN_ROUTES, withAdminLocalePath } from '@/lib/adminRoutes';
import { defaultLocale } from '@/i18n/settings';

type AdminChromeProps = {
  children: React.ReactNode;
};

export default function AdminChrome({ children }: Readonly<AdminChromeProps>) {
  const { t } = useTranslation('admin-common');
  const router = useRouter();
  const pathname = usePathname();
  const params = useParams<{ locale?: string | string[] }>();
  const routeLocale = Array.isArray(params?.locale) ? params.locale[0] : params?.locale;
  const locale = routeLocale ?? defaultLocale;
  const isMobile = useMediaQuery('(max-width: 991px)');
  const [adminIconStyle, triggerAdminIconBoop] = useBoop({ x: 2, rotation: 8, scale: 1.08, timing: 170 });
  const [isNavExpanded, setIsNavExpanded] = React.useState(false);
  const [adminUser, setAdminUser] = React.useState<{
    id: string;
    name: string | null;
    username: string | null;
    avatarUrl: string | null;
    email: string;
    roles: string[];
  } | null>(null);
  const showSidebarToggle = Boolean(pathname && /\/admin\/?$/.test(pathname));

  const loadAdminUser = React.useCallback(async () => {
    try {
      const me = await fetchAdminMe();
      setAdminUser(me.authenticated ? me.user : null);
    } catch {
      setAdminUser(null);
    }
  }, []);

  React.useEffect(() => {
    void loadAdminUser();
  }, [loadAdminUser, locale, pathname]);

  React.useEffect(() => {
    const handleAdminUserUpdated = (event: Event) => {
      const customEvent = event as CustomEvent<{
        user?: {
          id: string;
          name: string | null;
          username: string | null;
          avatarUrl: string | null;
          email: string;
          roles: string[];
        } | null;
      }>;

      if (customEvent.detail?.user) {
        setAdminUser(customEvent.detail.user);
        return;
      }

      void loadAdminUser();
    };

    globalThis.addEventListener('admin:user-updated', handleAdminUserUpdated);
    return () => {
      globalThis.removeEventListener('admin:user-updated', handleAdminUserUpdated);
    };
  }, [loadAdminUser]);

  const handleLogout = React.useCallback(async () => {
    await logoutAdmin();
    setAdminUser(null);
    setIsNavExpanded(false);
    router.replace(withAdminLocalePath(locale, ADMIN_ROUTES.login));
  }, [locale, router]);

  const handleSidebarToggle = React.useCallback(() => {
    globalThis.dispatchEvent(new Event('admin:sidebar-toggle'));
  }, []);

  const adminLabel = adminUser?.username?.trim() || adminUser?.email || t('adminCommon.user.label');
  const adminMenuAvatarUrl = React.useMemo(() => withAdminAvatarSize(adminUser?.avatarUrl, 32), [adminUser?.avatarUrl]);
  const adminDropdownAvatarUrl = React.useMemo(
    () => withAdminAvatarSize(adminUser?.avatarUrl, 32),
    [adminUser?.avatarUrl],
  );
  const adminDropdownUsername = adminUser?.username?.trim() || adminUser?.email;
  const adminDropdownName = adminUser?.name?.trim() || adminUser?.email;

  return (
    <div className="min-vh-100 d-flex flex-column">
      <Navbar
        expand="lg"
        expanded={isNavExpanded}
        onToggle={(expanded: boolean) => setIsNavExpanded(Boolean(expanded))}
        className={`shadow-sm sticky-top p-2${isNavExpanded ? ' is-mobile-nav-expanded' : ''}`}
      >
        {showSidebarToggle ? (
          <button
            type="button"
            className="sidebar-toggler"
            onClick={handleSidebarToggle}
            aria-label={t('adminCommon.actions.toggleSidebar')}
          >
            <FontAwesomeIcon icon="sidebar" className="sidebar-toggler-icon" />
          </button>
        ) : null}
        <Navbar.Brand as={Link} href={ADMIN_ROUTES.root} className="navbar-brand link">
          <Image src={SITE_LOGO} alt={t('adminCommon.brand')} width={40} height={40} className="rounded-circle" />
          <span className="navbar-brand-text ms-2 fw-bold">{t('adminCommon.brand')}</span>
        </Navbar.Brand>

        {isMobile && (
          <Nav className="mobile-header-actions d-flex align-items-center flex-nowrap ms-auto d-lg-none">
            <div className="d-flex align-items-center mobile-language-slot">
              <LanguageSwitcher />
            </div>
            <div className="d-flex align-items-center mobile-theme-slot">
              <ThemeToggler />
            </div>
          </Nav>
        )}

        <Navbar.Toggle aria-controls="admin-navbar-nav">
          <FontAwesomeIcon icon={isNavExpanded ? 'times' : 'bars'} />
        </Navbar.Toggle>
        <Navbar.Collapse id="admin-navbar-nav">
          <div className="d-lg-flex w-100 align-items-center flex-column flex-lg-row">
            <div className="d-flex w-100 align-items-center flex-column flex-lg-row gap-2">
              <div className="me-lg-auto" />

              <Nav className="d-flex align-items-center gap-2 ms-lg-auto">
                <div className="d-flex align-items-center">
                  <VoiceToggler />
                </div>
                {!isMobile && (
                  <div className="d-flex align-items-center">
                    <LanguageSwitcher />
                  </div>
                )}
                {!isMobile && (
                  <div className="d-flex align-items-center">
                    <ThemeToggler />
                  </div>
                )}
                {adminUser ? (
                  <NavDropdown
                    onMouseEnter={triggerAdminIconBoop}
                    onFocus={triggerAdminIconBoop}
                    id="admin-user-dropdown"
                    align="end"
                    title={
                      <span className="admin-user-trigger">
                        <span className="admin-user-trigger-icon">
                          {adminMenuAvatarUrl ? (
                            <Image
                              src={adminMenuAvatarUrl}
                              alt={adminLabel}
                              width={32}
                              height={32}
                              unoptimized
                              className="w-100 h-100 rounded-circle object-fit-cover icon-boop-target"
                              style={adminIconStyle}
                            />
                          ) : (
                            <FontAwesomeIcon icon="user" className="icon-boop-target" style={adminIconStyle} />
                          )}
                        </span>
                      </span>
                    }
                    className="admin-user-dropdown"
                  >
                    <NavDropdown.Header className="admin-user-dropdown-header">
                      <span className="admin-user-dropdown-avatar">
                        {adminDropdownAvatarUrl ? (
                          <Image
                            src={adminDropdownAvatarUrl}
                            alt={adminLabel}
                            width={32}
                            height={32}
                            sizes="32px"
                            unoptimized
                            className="w-100 h-100 rounded-circle object-fit-cover"
                          />
                        ) : (
                          <FontAwesomeIcon icon="user" />
                        )}
                      </span>
                      <span className="admin-user-dropdown-meta">
                        <span className="admin-user-dropdown-title">{adminDropdownUsername}</span>
                        <span className="admin-user-dropdown-subtitle">{adminDropdownName}</span>
                      </span>
                    </NavDropdown.Header>
                    <NavDropdown.Divider className="admin-user-dropdown-divider" />
                    <NavDropdown.Item
                      as={Link}
                      href={ADMIN_ROUTES.settings.profile}
                      onClick={() => setIsNavExpanded(false)}
                    >
                      <span className="d-inline-flex align-items-center gap-2">
                        <FontAwesomeIcon icon="gear" fixedWidth />
                        <span>{t('adminCommon.actions.settings')}</span>
                      </span>
                    </NavDropdown.Item>
                    <NavDropdown.Divider />
                    <NavDropdown.Item onClick={handleLogout}>
                      <span className="d-inline-flex align-items-center gap-2">
                        <FontAwesomeIcon icon="right-from-bracket" fixedWidth />
                        <span>{t('adminCommon.actions.logout')}</span>
                      </span>
                    </NavDropdown.Item>
                  </NavDropdown>
                ) : null}
              </Nav>
            </div>
          </div>
        </Navbar.Collapse>
      </Navbar>

      <main className="flex-grow-1 layout-main-col">
        <div className="admin-chrome-shell">{children}</div>
      </main>

      <Footer />
    </div>
  );
}
