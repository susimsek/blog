import React, { useState, useRef, useEffect, useMemo } from 'react';
import { ListGroup } from 'react-bootstrap';
import SearchBar from '@/components/search/SearchBar';
import PostListItem from '@/components/posts/PostListItem';
import Link from '@/components/common/Link';
import { PostSummary } from '@/types/posts';
import { filterByQuery } from '@/lib/postFilters';
import { useTranslation } from 'next-i18next';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

interface SearchContainerProps {
  posts: PostSummary[];
}

export default function SearchContainer({ posts }: SearchContainerProps) {
  const { t } = useTranslation('common');
  const [searchQuery, setSearchQuery] = useState('');
  const [showResults, setShowResults] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  const searchResults = useMemo(() => {
    if (searchQuery.trim() && posts.length > 0) {
      return posts.filter(post => filterByQuery(post, searchQuery)).slice(0, 5);
    }
    return [];
  }, [posts, searchQuery]);

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    setShowResults(query.trim().length > 0 && searchResults.length > 0);
  };

  const handleClickOutside = (event: MouseEvent) => {
    if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
      setShowResults(false);
    }
  };

  const handleViewAllResults = () => {
    setShowResults(false);
  };

  useEffect(() => {
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  return (
    <div ref={searchRef} className="search-container ms-auto mt-3 mt-lg-0">
      <SearchBar query={searchQuery} onChange={handleSearch} />
      {showResults && searchQuery && (
        <ListGroup className="ms-auto search-results">
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
                href={`/search?query=${encodeURIComponent(searchQuery)}`}
                onClick={handleViewAllResults}
              >
                <FontAwesomeIcon icon="search" className="me-2" />
                <span className="text-start fw-bold">{t('common.viewAllResults')}</span>
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
