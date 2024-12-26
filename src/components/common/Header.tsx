import { Container, Navbar, Nav, ListGroup } from 'react-bootstrap';
import { useTranslation } from 'next-i18next';
import Link from '@/components/common/Link';
import LanguageSwitcher from '@/components/i18n/LanguageSwitcher';
import ThemeToggler from '@/components/theme/ThemeToggler';
import React, { useState, useRef, useEffect } from 'react';
import { PostSummary } from '@/types/posts';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { ReactComponent as Logo } from '@assets/images/logo.svg';
import PostListItem from '@/components/posts/PostListItem';
import SearchBar from '@/components/search/SearchBar';

interface HeaderProps {
  posts?: PostSummary[];
  searchEnabled?: boolean;
}

export default function Header({ posts = [], searchEnabled = false }: Readonly<HeaderProps>) {
  const { t } = useTranslation('common');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<PostSummary[]>([]);
  const [showResults, setShowResults] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  const handleSearch = (query: string) => {
    setSearchQuery(query);

    if (query.trim() && posts.length > 0) {
      const filteredPosts = posts
        .filter(
          post =>
            post.title.toLowerCase().includes(query.toLowerCase()) ||
            (post.summary && post.summary.toLowerCase().includes(query.toLowerCase())),
        )
        .slice(0, 5);
      setSearchResults(filteredPosts);
      setShowResults(true);
    } else {
      setSearchResults([]);
      setShowResults(false);
    }
  };

  const handleClickOutside = (event: MouseEvent) => {
    if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
      setShowResults(false);
    }
  };

  useEffect(() => {
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  return (
    <Navbar expand="lg" className="shadow-sm sticky-top">
      <Container>
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
            {searchEnabled && (
              <div ref={searchRef} className="search-container mt-3 mt-lg-0">
                <SearchBar query={searchQuery} onChange={handleSearch} />
                {showResults && searchQuery && (
                  <ListGroup className="search-results">
                    {searchResults.length > 0 ? (
                      searchResults.map(result => (
                        <ListGroup.Item key={result.id} className="p-3">
                          <PostListItem post={result} />
                        </ListGroup.Item>
                      ))
                    ) : (
                      <ListGroup.Item className="text-center text-muted py-3">{t('common.noResults')}</ListGroup.Item>
                    )}
                  </ListGroup>
                )}
              </div>
            )}
            {/* Navigation Links */}
            <Nav className="ms-auto d-flex gap-3 align-items-center">
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
              <div className="d-flex align-items-center">
                <ThemeToggler />
              </div>
            </Nav>
          </div>
        </Navbar.Collapse>
      </Container>
    </Navbar>
  );
}
