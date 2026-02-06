import { Navbar, Nav } from 'react-bootstrap';
import { useTranslation } from 'next-i18next';
import Link from '@/components/common/Link';
import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { SITE_LOGO } from '@/config/constants';
import SearchContainer from '@/components/search/SearchContainer';
import useMediaQuery from '@/hooks/useMediaQuery';
import Image from 'next/image';
import dynamic from 'next/dynamic';

const LanguageSwitcher = dynamic(() => import('@/components/i18n/LanguageSwitcher'));
const ThemeToggler = dynamic(() => import('@/components/theme/ThemeToggler'));

interface HeaderProps {
  searchEnabled?: boolean;
  onSidebarToggle?: () => void;
  sidebarEnabled?: boolean;
}

export default function Header({
  searchEnabled = false,
  sidebarEnabled = false,
  onSidebarToggle,
}: Readonly<HeaderProps>) {
  const { t } = useTranslation('common');

  const [searchVisible, setSearchVisible] = React.useState(false);
  const isTablet = useMediaQuery('(min-width: 768px) and (max-width: 1366px)');

  const handleSearchToggle = () => {
    setSearchVisible(prev => !prev);
  };

  const renderSearchSection = () => (
    <div className="d-flex w-100 align-items-center">
      <button
        className="nav-link bg-transparent border-0 p-0 d-flex align-items-center"
        onClick={handleSearchToggle}
        aria-label="Hide search"
      >
        <FontAwesomeIcon icon="chevron-left" className="me-3" />
      </button>

      <div className="flex-grow-1">
        <SearchContainer />
      </div>

      <Nav className="d-flex align-items-center gap-3 ms-3">
        <div className="d-flex align-items-center">
          <LanguageSwitcher />
        </div>
        <div className="d-flex align-items-center me-md-64">
          <ThemeToggler />
        </div>
      </Nav>
    </div>
  );

  return (
    <Navbar expand="lg" className="shadow-sm sticky-top p-2">
      {sidebarEnabled && (
        <button type="button" className="sidebar-toggler" onClick={onSidebarToggle} aria-label="sidebarToggle">
          <FontAwesomeIcon icon="sidebar" className="sidebar-toggler-icon" />
        </button>
      )}
      <Navbar.Brand as={Link} href="/" className="navbar-brand link">
        <Image src={SITE_LOGO} alt={t('common.header.title')} width={40} height={40} className="rounded-circle" />
        <span className="ms-2 fw-bold" style={{ fontSize: '1.25rem' }}>
          {t('common.header.title')}
        </span>
      </Navbar.Brand>
      <Navbar.Toggle aria-controls="navbar-nav">
        <FontAwesomeIcon icon="bars" />
      </Navbar.Toggle>
      <Navbar.Collapse id="navbar-nav">
        <div className="d-lg-flex w-100 align-items-center flex-column flex-lg-row">
          {/* Tablet Search Mode */}
          {searchEnabled && isTablet && searchVisible && renderSearchSection()}

          {/* Default Desktop or Non-Search Tablet View */}
          {!isTablet && searchEnabled && <SearchContainer />}

          {!(isTablet && searchVisible) && (
            <Nav
              className={`d-flex align-items-center ${isTablet ? 'gap-2' : 'gap-3'} ${searchEnabled ? '' : 'ms-auto'}`}
            >
              {/* Search toggle button on tablet */}
              {searchEnabled && isTablet && !searchVisible && (
                <button
                  onClick={handleSearchToggle}
                  className="nav-link d-flex align-items-center bg-transparent border-0"
                >
                  <FontAwesomeIcon icon="search" className="me-2" />
                  {t('common.header.menu.search')}
                </button>
              )}

              <Nav.Link as={Link} href="/" className="d-flex align-items-center">
                <FontAwesomeIcon icon="home" className="me-2" />
                {t('common.header.menu.home')}
              </Nav.Link>
              <Nav.Link as={Link} href="/medium" className="d-flex align-items-center">
                <FontAwesomeIcon icon={['fab', 'medium']} className="me-2 medium-brand-logo" />
                Medium
              </Nav.Link>
              <Nav.Link as={Link} href="/about" className="d-flex align-items-center">
                <FontAwesomeIcon icon="info-circle" className="me-2" />
                {t('common.header.menu.about')}
              </Nav.Link>
              <Nav.Link as={Link} href="/contact" className="d-flex align-items-center">
                <FontAwesomeIcon icon="address-book" className="me-2" />
                {t('common.header.menu.contact')}
              </Nav.Link>
              <div className="d-flex align-items-center">
                <LanguageSwitcher />
              </div>
              <div className="d-flex align-items-center me-md-64">
                <ThemeToggler />
              </div>
            </Nav>
          )}
        </div>
      </Navbar.Collapse>
    </Navbar>
  );
}
