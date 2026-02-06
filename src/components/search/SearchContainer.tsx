import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import ListGroup from 'react-bootstrap/ListGroup';
import SearchBar from '@/components/search/SearchBar';
import PostListItem from '@/components/posts/PostListItem';
import Link from '@/components/common/Link';
import { filterByQuery } from '@/lib/postFilters';
import { useTranslation } from 'react-i18next';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import useDebounce from '@/hooks/useDebounce';
import { useAppDispatch, useAppSelector } from '@/config/store';
import { setQuery } from '@/reducers/postsQuery';

export default function SearchContainer() {
  const { t } = useTranslation('common');
  const dispatch = useAppDispatch();
  const posts = useAppSelector(state => state.postsQuery.posts);
  const searchQuery = useAppSelector(state => state.postsQuery.query);
  const [showResults, setShowResults] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  const debouncedSearchQuery = useDebounce(searchQuery, 500);

  const searchResults = useMemo(() => {
    const query = debouncedSearchQuery.trim() || searchQuery.trim();
    if (query && posts.length > 0) {
      return posts.filter(post => filterByQuery(post, query)).slice(0, 5);
    }
    return [];
  }, [posts, debouncedSearchQuery, searchQuery]);

  const handleSearch = (query: string) => {
    dispatch(setQuery(query));
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

  useEffect(() => {
    if (!showResults) {
      return;
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showResults, handleClickOutside]);

  return (
    <div ref={searchRef} className="search-container ms-auto mt-3 mt-lg-0">
      <SearchBar query={searchQuery} onChange={handleSearch} />
      {showResults && searchQuery && (
        <ListGroup className="ms-auto w-100 search-results">
          {searchResults.length > 0 ? (
            <>
              {searchResults.map(result => (
                <ListGroup.Item as={Link} action key={result.id} href={`/posts/${result.id}`} className="p-3">
                  <PostListItem post={result} />
                </ListGroup.Item>
              ))}
              <ListGroup.Item
                as={Link}
                action
                className="py-3 d-flex align-items-center"
                href={`/search?q=${encodeURIComponent(searchQuery)}`}
                onClick={handleViewAllResults}
              >
                <FontAwesomeIcon icon="search" className="me-2" />
                {t('common.viewAllResults', { query: searchQuery })}
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
