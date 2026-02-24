import Navbar from 'react-bootstrap/Navbar';
import Nav from 'react-bootstrap/Nav';
import NavDropdown from 'react-bootstrap/NavDropdown';
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
import { getAllPostCategories } from '@/lib/postCategories';

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
  const { t, i18n } = useTranslation('common');
  const [searchIconStyle, triggerSearchIconBoop] = useBoop({ y: 3, rotation: 8, scale: 1.08, timing: 170 });
  const [searchCloseIconStyle, triggerSearchCloseIconBoop] = useBoop({ y: 3, rotation: -8, scale: 1.08, timing: 170 });
  const [sidebarIconStyle, triggerSidebarIconBoop] = useBoop({ y: 2, rotation: 8, scale: 1.08, timing: 170 });
  const [hamburgerIconStyle, triggerHamburgerIconBoop] = useBoop({ y: 2, rotation: 8, scale: 1.08, timing: 170 });
  const [rssIconStyle, triggerRssIconBoop] = useBoop({ y: 2, rotation: -10, scale: 1.08, timing: 170 });

  const [searchVisible, setSearchVisible] = React.useState(false);
  const [isNavExpanded, setIsNavExpanded] = React.useState(false);
  const isTablet = useMediaQuery('(min-width: 768px) and (max-width: 1366px)');
  const isMobile = useMediaQuery('(max-width: 991px)');
  const resolvedLanguage = i18n?.resolvedLanguage ?? i18n?.language ?? 'en';
  const categories = React.useMemo(() => getAllPostCategories(resolvedLanguage), [resolvedLanguage]);

  const shortcutHint = React.useMemo(() => {
    if (typeof navigator === 'undefined') {
      return { modifier: 'Ctrl', key: 'K' };
    }

    const nav = navigator as Navigator & { userAgentData?: { platform?: string } };
    const platform = (nav.userAgentData?.platform ?? nav.platform ?? '').toLowerCase();
    const isMac = /(mac|iphone|ipad|ipod)/.test(platform);

    return { modifier: isMac ? '⌘' : 'Ctrl', key: 'K' };
  }, []);

  const focusSearchInput = React.useCallback(() => {
    window.dispatchEvent(new Event('app:search-focus'));
  }, []);

  const searchVisibleRef = React.useRef(false);

  React.useEffect(() => {
    searchVisibleRef.current = searchVisible;
  }, [searchVisible]);

  const openSearch = React.useCallback(() => {
    setSearchVisible(true);
    requestAnimationFrame(() => {
      requestAnimationFrame(focusSearchInput);
    });
  }, [focusSearchInput]);

  const closeSearch = React.useCallback((options?: { clearQuery?: boolean }) => {
    const clearQuery = options?.clearQuery ?? false;
    setSearchVisible(false);
    window.dispatchEvent(new CustomEvent('app:search-close', { detail: { clearQuery } }));
  }, []);

  const handleSearchToggle = React.useCallback(() => {
    setSearchVisible(previous => {
      const next = !previous;
      if (next) {
        requestAnimationFrame(() => {
          requestAnimationFrame(focusSearchInput);
        });
      } else {
        window.dispatchEvent(new CustomEvent('app:search-close', { detail: { clearQuery: false } }));
      }
      return next;
    });
  }, [focusSearchInput]);

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
      const isSearchOpen = searchVisibleRef.current;

      if (event.key === 'Escape' && isSearchOpen) {
        event.preventDefault();
        closeSearch({ clearQuery: true });
        return;
      }

      const isK = event.key.toLowerCase() === 'k';
      if (!isK || (!event.metaKey && !event.ctrlKey)) {
        return;
      }

      const target = event.target as HTMLElement | null;
      const isEditableTarget =
        !!target &&
        (target.isContentEditable ||
          target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          (target as unknown as { role?: string }).role === 'textbox');

      if (isEditableTarget && !isSearchOpen) {
        return;
      }

      event.preventDefault();

      if (!isSearchOpen) {
        openSearch();
        return;
      }

      focusSearchInput();
    };

    const listenerOptions: AddEventListenerOptions = { capture: true };

    window.addEventListener('keydown', handleShortcut, listenerOptions);
    return () => {
      window.removeEventListener('keydown', handleShortcut, listenerOptions);
    };
  }, [closeSearch, focusSearchInput, openSearch, searchEnabled]);

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
          <SearchContainer shortcutHint={shortcutHint} />
        </div>
      </div>
    </div>
  );

  return (
    <Navbar
      expand="lg"
      expanded={isNavExpanded}
      onToggle={(expanded: boolean) => setIsNavExpanded(Boolean(expanded))}
      className={`shadow-sm sticky-top p-2${isNavExpanded ? ' is-mobile-nav-expanded' : ''}`}
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
        <span className="navbar-brand-text ms-2 fw-bold">{t('common.header.title')}</span>
      </Navbar.Brand>
      {isMobile && (
        <Nav className="mobile-header-actions d-flex align-items-center flex-nowrap ms-auto d-lg-none">
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
          <div className="d-flex align-items-center mobile-language-slot">
            <LanguageSwitcher />
          </div>
          <div className="d-flex align-items-center mobile-theme-slot">
            <ThemeToggler />
          </div>
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
              {categories.length > 0 && (
                <NavDropdown
                  id="categories-nav-dropdown"
                  title={
                    <span className="d-inline-flex align-items-center">
                      <FontAwesomeIcon icon="layer-group" className="me-2" />
                      <span>{t('common.header.menu.categories')}</span>
                    </span>
                  }
                >
                  {categories.map(category => (
                    <NavDropdown.Item key={category.id} as={Link} href={`/categories/${category.id}`}>
                      <span className="d-inline-flex align-items-center">
                        {category.id === 'programming' && <FontAwesomeIcon icon="code" className="me-2" />}
                        <span>{category.name}</span>
                      </span>
                    </NavDropdown.Item>
                  ))}
                </NavDropdown>
              )}
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
              {!isMobile && (
                <Link
                  href="/rss.xml"
                  className="nav-link nav-icon-boop d-flex align-items-center"
                  onMouseEnter={triggerRssIconBoop}
                  aria-label={t('common.header.actions.openRss')}
                >
                  <FontAwesomeIcon icon="rss" className="icon-boop-target" style={rssIconStyle} />
                </Link>
              )}
            </Nav>
          </div>
        </div>
      </Navbar.Collapse>
      {searchEnabled && searchVisible && renderSearchOverlay()}
    </Navbar>
  );
}
