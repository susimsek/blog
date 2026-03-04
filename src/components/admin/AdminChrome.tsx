'use client';

import React from 'react';
import Footer from '@/components/common/Footer';
import Link from '@/components/common/Link';
import LanguageSwitcher from '@/components/i18n/LanguageSwitcher';
import ThemeToggler from '@/components/theme/ThemeToggler';
import VoiceToggler from '@/components/voice/VoiceToggler';
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
  const [isNavExpanded, setIsNavExpanded] = React.useState(false);
  const [adminUser, setAdminUser] = React.useState<{
    id: string;
    username: string | null;
    email: string;
    roles: string[];
  } | null>(null);
  const showSidebarToggle = pathname?.includes('/admin/dashboard') ?? false;

  React.useEffect(() => {
    let isMounted = true;

    const loadAdminUser = async () => {
      try {
        const me = await fetchAdminMe();
        if (!isMounted) {
          return;
        }

        setAdminUser(me.authenticated ? me.user : null);
      } catch {
        if (isMounted) {
          setAdminUser(null);
        }
      }
    };

    void loadAdminUser();

    return () => {
      isMounted = false;
    };
  }, [locale, pathname]);

  const handleLogout = React.useCallback(async () => {
    await logoutAdmin();
    setAdminUser(null);
    setIsNavExpanded(false);
    router.replace(`/${locale}/admin/login`);
  }, [locale, router]);

  const handleSidebarToggle = React.useCallback(() => {
    globalThis.dispatchEvent(new Event('admin:sidebar-toggle'));
  }, []);

  const adminLabel = adminUser?.username?.trim() || adminUser?.email || t('adminCommon.user.label');

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
        <Navbar.Brand as={Link} href="/admin/dashboard" className="navbar-brand link">
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
                    id="admin-user-dropdown"
                    align="end"
                    title={
                      <span className="admin-user-trigger">
                        <span className="admin-user-trigger-icon">
                          <FontAwesomeIcon icon="user" />
                        </span>
                        <span className="admin-user-trigger-label">{adminLabel}</span>
                      </span>
                    }
                    className="text-center admin-user-dropdown"
                  >
                    <NavDropdown.Header className="admin-user-dropdown-header">
                      <span className="admin-user-dropdown-title">{adminLabel}</span>
                      <span className="admin-user-dropdown-subtitle">{adminUser.email}</span>
                    </NavDropdown.Header>
                    <NavDropdown.Item as={Link} href="/admin/change-password" onClick={() => setIsNavExpanded(false)}>
                      <span className="d-inline-flex align-items-center gap-2">
                        <FontAwesomeIcon icon="lock" fixedWidth />
                        <span>{t('adminCommon.actions.changePassword')}</span>
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
