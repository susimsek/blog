import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import ListGroup from 'react-bootstrap/ListGroup';
import SearchBar from '@/components/search/SearchBar';
import PostListItem from '@/components/posts/PostListItem';
import Link from '@/components/common/Link';
import { searchPostsByRelevance } from '@/lib/postFilters';
import { useTranslation } from 'react-i18next';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { useAppSelector } from '@/config/store';

export default function SearchContainer() {
  const { t } = useTranslation('common');
  const posts = useAppSelector(state => state.postsQuery.posts);
  const [searchQuery, setSearchQuery] = useState('');
  const [showResults, setShowResults] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const normalizedQuery = searchQuery.trim();

  const searchResults = useMemo(() => {
    if (normalizedQuery.length >= 2 && posts.length > 0) {
      return searchPostsByRelevance(posts, normalizedQuery, 5);
    }
    return [];
  }, [posts, normalizedQuery]);

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    setShowResults(query.trim().length > 0);
  };

  const handleClickOutside = useCallback((event: MouseEvent) => {
    if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
      setShowResults(false);
    }
  }, []);

  const handleViewAllResults = () => {
    setShowResults(false);
  };

  const handlePostResultClick = () => {
    setShowResults(false);
    setSearchQuery('');
  };

  useEffect(() => {
    if (!showResults) {
      return;
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showResults, handleClickOutside]);

  useEffect(() => {
    const handleSearchFocus = () => {
      searchInputRef.current?.focus();
      if (searchQuery.trim().length > 0) {
        setShowResults(true);
      }
    };

    const handleSearchClose = (event: Event) => {
      const shouldClearQuery =
        event instanceof CustomEvent &&
        typeof event.detail === 'object' &&
        event.detail !== null &&
        'clearQuery' in event.detail &&
        event.detail.clearQuery === true;

      setShowResults(false);
      searchInputRef.current?.blur();
      if (shouldClearQuery) {
        setSearchQuery('');
      }
    };

    window.addEventListener('app:search-focus', handleSearchFocus as EventListener);
    window.addEventListener('app:search-close', handleSearchClose as EventListener);
    return () => {
      window.removeEventListener('app:search-focus', handleSearchFocus as EventListener);
      window.removeEventListener('app:search-close', handleSearchClose as EventListener);
    };
  }, [searchQuery]);

  return (
    <div ref={searchRef} className="search-container ms-auto mt-3 mt-lg-0">
      <SearchBar query={searchQuery} onChange={handleSearch} inputRef={searchInputRef} showShortcutHint />
      {showResults && normalizedQuery.length >= 2 && (
        <ListGroup className="ms-auto w-100 search-results">
          {searchResults.length > 0 ? (
            <>
              {searchResults.map(result => (
                <ListGroup.Item
                  as={Link}
                  action
                  key={result.id}
                  href={`/posts/${result.id}`}
                  className="p-3"
                  onClick={handlePostResultClick}
                >
                  <PostListItem post={result} />
                </ListGroup.Item>
              ))}
              <ListGroup.Item
                as={Link}
                action
                className="py-3 d-flex align-items-center"
                href={`/search?q=${encodeURIComponent(normalizedQuery)}`}
                onClick={handleViewAllResults}
              >
                <FontAwesomeIcon icon="search" className="me-2" />
                {t('common.viewAllResults', { query: normalizedQuery })}
              </ListGroup.Item>
            </>
          ) : (
            <ListGroup.Item className="text-center text-muted py-3">
              <FontAwesomeIcon icon="exclamation-circle" className="me-2" />
              {t('common.noResults')}
            </ListGroup.Item>
          )}
        </ListGroup>
      )}
    </div>
  );
}
