import Navbar from 'react-bootstrap/Navbar';
import Nav from 'react-bootstrap/Nav';
import { useTranslation } from 'react-i18next';
import Link from '@/components/common/Link';
import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { SITE_LOGO } from '@/config/constants';
import useMediaQuery from '@/hooks/useMediaQuery';
import Image from 'next/image';
import useBoop from '@/hooks/useBoop';
import SearchContainer from '@/components/search/SearchContainer';
import LanguageSwitcher from '@/components/i18n/LanguageSwitcher';
import ThemeToggler from '@/components/theme/ThemeToggler';
import VoiceToggler from '@/components/voice/VoiceToggler';

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
  const [searchIconStyle, triggerSearchIconBoop] = useBoop({ y: 3, rotation: 8, scale: 1.08, timing: 170 });
  const [searchCloseIconStyle, triggerSearchCloseIconBoop] = useBoop({ y: 3, rotation: -8, scale: 1.08, timing: 170 });
  const [sidebarIconStyle, triggerSidebarIconBoop] = useBoop({ y: 2, rotation: 8, scale: 1.08, timing: 170 });
  const [hamburgerIconStyle, triggerHamburgerIconBoop] = useBoop({ y: 2, rotation: 8, scale: 1.08, timing: 170 });

  const [searchVisible, setSearchVisible] = React.useState(false);
  const [isNavExpanded, setIsNavExpanded] = React.useState(false);
  const isTablet = useMediaQuery('(min-width: 768px) and (max-width: 1366px)');
  const isMobile = useMediaQuery('(max-width: 991px)');

  const focusSearchInput = React.useCallback(() => {
    window.dispatchEvent(new Event('app:search-focus'));
  }, []);

  const handleSearchToggle = () => {
    setSearchVisible(previous => {
      const next = !previous;
      if (next) {
        requestAnimationFrame(() => {
          requestAnimationFrame(focusSearchInput);
        });
      }
      return next;
    });
  };

  React.useEffect(() => {
    if (!searchVisible) {
      return;
    }

    const previousBodyOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.body.style.overflow = previousBodyOverflow;
    };
  }, [searchVisible]);

  React.useEffect(() => {
    if (!searchEnabled) {
      return;
    }

    const handleShortcut = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && searchVisible) {
        setSearchVisible(false);
        window.dispatchEvent(new CustomEvent('app:search-close', { detail: { clearQuery: true } }));
        return;
      }

      const isK = event.key.toLowerCase() === 'k';
      if (!isK || (!event.metaKey && !event.ctrlKey)) {
        return;
      }

      event.preventDefault();

      if (!searchVisible) {
        setSearchVisible(true);
        requestAnimationFrame(() => {
          requestAnimationFrame(focusSearchInput);
        });
        return;
      }

      focusSearchInput();
    };

    window.addEventListener('keydown', handleShortcut);
    return () => {
      window.removeEventListener('keydown', handleShortcut);
    };
  }, [focusSearchInput, searchEnabled, searchVisible]);

  const renderSearchOverlay = () => (
    <div className="search-overlay" role="dialog" aria-modal="true" aria-label={t('common.searchBar.placeholder')}>
      <button
        type="button"
        className="search-overlay-backdrop"
        onClick={handleSearchToggle}
        aria-label={t('common.searchBar.placeholder')}
      />

      <button
        type="button"
        className="search-overlay-close nav-link nav-icon-boop bg-transparent border-0"
        onClick={handleSearchToggle}
        onMouseEnter={triggerSearchCloseIconBoop}
        aria-label={t('common.header.actions.hideSearch')}
      >
        <FontAwesomeIcon icon="times" className="icon-boop-target" style={searchCloseIconStyle} />
      </button>

      <div className="search-overlay-panel">
        <div className="search-overlay-content">
          <SearchContainer />
        </div>
      </div>
    </div>
  );

  return (
    <Navbar
      expand="lg"
      expanded={isNavExpanded}
      onToggle={(expanded: boolean) => setIsNavExpanded(Boolean(expanded))}
      className="shadow-sm sticky-top p-2"
    >
      {sidebarEnabled && (
        <button
          type="button"
          className="sidebar-toggler nav-icon-boop"
          onClick={onSidebarToggle}
          onMouseEnter={triggerSidebarIconBoop}
          onFocus={triggerSidebarIconBoop}
          aria-label={t('common.header.actions.toggleSidebar')}
        >
          <FontAwesomeIcon icon="sidebar" className="sidebar-toggler-icon icon-boop-target" style={sidebarIconStyle} />
        </button>
      )}
      <Navbar.Brand as={Link} href="/" className="navbar-brand link">
        <Image src={SITE_LOGO} alt={t('common.header.title')} width={40} height={40} className="rounded-circle" />
        <span className="ms-2 fw-bold" style={{ fontSize: '1.25rem' }}>
          {t('common.header.title')}
        </span>
      </Navbar.Brand>
      {isMobile && (
        <Nav className="mobile-header-actions d-flex align-items-center flex-nowrap ms-auto d-lg-none">
          <div className="d-flex align-items-center mobile-theme-slot">
            <ThemeToggler />
          </div>
          {searchEnabled && (
            <button
              type="button"
              onClick={handleSearchToggle}
              onMouseEnter={triggerSearchIconBoop}
              className="nav-link nav-icon-boop mobile-search-btn d-flex align-items-center bg-transparent border-0"
              aria-label={t('common.header.actions.showSearch')}
            >
              <FontAwesomeIcon icon="search" className="icon-boop-target" style={searchIconStyle} />
            </button>
          )}
        </Nav>
      )}
      <Navbar.Toggle
        aria-controls="navbar-nav"
        className="nav-icon-boop"
        onMouseEnter={triggerHamburgerIconBoop}
        onFocus={triggerHamburgerIconBoop}
      >
        <FontAwesomeIcon
          icon={isNavExpanded ? 'times' : 'bars'}
          className="icon-boop-target"
          style={hamburgerIconStyle}
        />
      </Navbar.Toggle>
      <Navbar.Collapse id="navbar-nav">
        <div className="d-lg-flex w-100 align-items-center flex-column flex-lg-row">
          <div className="d-flex w-100 align-items-center flex-column flex-lg-row gap-2">
            <Nav className={`d-flex align-items-center ${isTablet ? 'gap-2' : 'gap-3'} me-lg-auto`}>
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
            </Nav>
            <Nav className="d-flex align-items-center gap-2">
              {searchEnabled && !isMobile && (
                <button
                  type="button"
                  onClick={handleSearchToggle}
                  onMouseEnter={triggerSearchIconBoop}
                  className="nav-link nav-icon-boop d-flex align-items-center bg-transparent border-0"
                  aria-label={t('common.header.actions.showSearch')}
                >
                  <FontAwesomeIcon icon="search" className="icon-boop-target" style={searchIconStyle} />
                </button>
              )}
              <div className="d-flex align-items-center">
                <LanguageSwitcher />
              </div>
              <div className="d-flex align-items-center">
                <VoiceToggler />
              </div>
              {!isMobile && (
                <div className="d-flex align-items-center">
                  <ThemeToggler />
                </div>
              )}
            </Nav>
          </div>
        </div>
      </Navbar.Collapse>
      {searchEnabled && searchVisible && renderSearchOverlay()}
    </Navbar>
  );
}
