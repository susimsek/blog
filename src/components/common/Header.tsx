import { Navbar, Nav } from 'react-bootstrap';
import { useTranslation } from 'next-i18next';
import Link from '@/components/common/Link';
import LanguageSwitcher from '@/components/i18n/LanguageSwitcher';
import ThemeToggler from '@/components/theme/ThemeToggler';
import React from 'react';
import { PostSummary } from '@/types/posts';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { ReactComponent as Logo } from '@assets/images/logo.svg';
import SearchContainer from '@/components/search/SearchContainer';

interface HeaderProps {
  posts?: PostSummary[];
  searchEnabled?: boolean;
  onSidebarToggle?: () => void;
  sidebarEnabled?: boolean; // Sidebar toggle callback
}

export default function Header({
  posts = [],
  searchEnabled = false,
  sidebarEnabled = false,
  onSidebarToggle,
}: Readonly<HeaderProps>) {
  const { t } = useTranslation('common');

  return (
    <Navbar expand="lg" className="shadow-sm sticky-top p-2">
      {sidebarEnabled && (
        <button type="button" className="sidebar-toggler" onClick={onSidebarToggle} aria-label="sidebarToggle">
          <FontAwesomeIcon icon="sidebar" className="sidebar-toggler-icon" />
        </button>
      )}
      <Navbar.Brand as={Link} href="/" className="navbar-brand link">
        <Logo width={40} height={40} className="rounded-circle" />
        <span className="ms-2 fw-bold" style={{ fontSize: '1.25rem' }}>
          {t('common.header.title')}
        </span>
      </Navbar.Brand>
      <Navbar.Toggle aria-controls="navbar-nav">
        <FontAwesomeIcon icon="bars" />
      </Navbar.Toggle>
      <Navbar.Collapse id="navbar-nav">
        <div className="d-lg-flex w-100 align-items-center flex-column flex-lg-row">
          {/* Search Bar */}
          {searchEnabled && <SearchContainer posts={posts} />}
          {/* Navigation Links */}
          <Nav className={`d-flex gap-3 align-items-center ${searchEnabled ? '' : 'ms-auto'}`}>
            <Nav.Link as={Link} href="/" className="d-flex align-items-center">
              <FontAwesomeIcon icon="home" className="me-2" />
              {t('common.header.menu.home')}
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
        </div>
      </Navbar.Collapse>
    </Navbar>
  );
}
