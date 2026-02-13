import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import ListGroup from 'react-bootstrap/ListGroup';
import SearchBar from '@/components/search/SearchBar';
import PostListItem from '@/components/posts/PostListItem';
import Link from '@/components/common/Link';
import { searchPostsByRelevance } from '@/lib/postFilters';
import { useTranslation } from 'react-i18next';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { useAppSelector } from '@/config/store';
import { useRouter } from 'next/navigation';

const SEARCH_RESULTS_LIST_ID = 'header-search-results';

export default function SearchContainer() {
  const { t } = useTranslation('common');
  const router = useRouter();
  const posts = useAppSelector(state => state.postsQuery.posts);
  const [searchQuery, setSearchQuery] = useState('');
  const [showResults, setShowResults] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const searchRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const normalizedQuery = searchQuery.trim();
  const shouldRenderResults = showResults && normalizedQuery.length >= 2;

  const searchResults = useMemo(() => {
    if (normalizedQuery.length >= 2 && posts.length > 0) {
      const rankedPosts = searchPostsByRelevance(posts, normalizedQuery);
      const blogPosts = rankedPosts.filter(post => (post.source ?? 'blog') === 'blog');
      const mediumPosts = rankedPosts.filter(post => (post.source ?? 'blog') === 'medium');
      return [...blogPosts, ...mediumPosts].slice(0, 5);
    }
    return [];
  }, [posts, normalizedQuery]);

  const selectableCount = searchResults.length > 0 ? searchResults.length + 1 : 0;
  const effectiveActiveIndex =
    shouldRenderResults && activeIndex >= 0 && activeIndex < selectableCount ? activeIndex : -1;
  const activeDescendantId =
    effectiveActiveIndex >= 0 ? `${SEARCH_RESULTS_LIST_ID}-option-${effectiveActiveIndex}` : undefined;

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    setShowResults(query.trim().length > 0);
    setActiveIndex(-1);
  };

  const handleClickOutside = useCallback((event: MouseEvent) => {
    if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
      setShowResults(false);
    }
  }, []);

  const handleViewAllResults = () => {
    setShowResults(false);
    setActiveIndex(-1);
  };

  const handlePostResultClick = () => {
    setShowResults(false);
    setSearchQuery('');
    setActiveIndex(-1);
  };

  const navigateToHref = useCallback(
    (href: string) => {
      if (/^https?:\/\//i.test(href)) {
        globalThis.window.location.assign(href);
        return;
      }
      router.push(href);
    },
    [router],
  );

  const handleSelectOption = useCallback(
    (index: number) => {
      if (index < 0 || index >= selectableCount) {
        return;
      }

      if (index < searchResults.length) {
        const post = searchResults[index];
        const href = post.link ?? `/posts/${post.id}`;
        setShowResults(false);
        setSearchQuery('');
        setActiveIndex(-1);
        navigateToHref(href);
        return;
      }

      const searchHref = `/search?q=${encodeURIComponent(normalizedQuery)}`;
      setShowResults(false);
      setActiveIndex(-1);
      navigateToHref(searchHref);
    },
    [navigateToHref, normalizedQuery, searchResults, selectableCount],
  );

  const handleSearchKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLInputElement>) => {
      if (!shouldRenderResults) {
        if (event.key === 'Escape') {
          event.preventDefault();
          event.stopPropagation();
          setShowResults(false);
          setSearchQuery('');
          setActiveIndex(-1);
          searchInputRef.current?.blur();
        }
        return;
      }

      if (event.key === 'ArrowDown') {
        if (selectableCount === 0) {
          return;
        }
        event.preventDefault();
        setActiveIndex(previous => (previous + 1 >= selectableCount ? 0 : previous + 1));
        return;
      }

      if (event.key === 'ArrowUp') {
        if (selectableCount === 0) {
          return;
        }
        event.preventDefault();
        setActiveIndex(previous => (previous <= 0 ? selectableCount - 1 : previous - 1));
        return;
      }

      if (event.key === 'Enter') {
        if (selectableCount === 0) {
          return;
        }
        event.preventDefault();
        const targetIndex = effectiveActiveIndex >= 0 ? effectiveActiveIndex : 0;
        handleSelectOption(targetIndex);
        return;
      }

      if (event.key === 'Escape') {
        event.preventDefault();
        event.stopPropagation();
        setShowResults(false);
        setSearchQuery('');
        setActiveIndex(-1);
        searchInputRef.current?.blur();
      }
    },
    [effectiveActiveIndex, handleSelectOption, selectableCount, shouldRenderResults],
  );

  useEffect(() => {
    const nextDropdown = searchRef.current?.querySelector<HTMLElement>(
      `#${SEARCH_RESULTS_LIST_ID}-option-${effectiveActiveIndex}`,
    );
    if (typeof nextDropdown?.scrollIntoView === 'function') {
      nextDropdown.scrollIntoView({ block: 'nearest' });
    }
  }, [effectiveActiveIndex]);

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
        setActiveIndex(-1);
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
    <div ref={searchRef} className={`search-container${shouldRenderResults ? ' is-expanded' : ''}`}>
      <SearchBar
        query={searchQuery}
        onChange={handleSearch}
        onKeyDown={handleSearchKeyDown}
        className="search-bar--header"
        inputRef={searchInputRef}
        showShortcutHint
        expanded={shouldRenderResults}
        controlsId={SEARCH_RESULTS_LIST_ID}
        activeDescendantId={activeDescendantId}
      />
      {shouldRenderResults && (
        <ListGroup
          id={SEARCH_RESULTS_LIST_ID}
          className="ms-auto w-100 search-results header-search-results"
          role="listbox"
        >
          {searchResults.length > 0 ? (
            <>
              {searchResults.map((result, index) => (
                <ListGroup.Item
                  as={Link}
                  action
                  key={`${result.source ?? 'blog'}:${result.id}`}
                  href={result.link ?? `/posts/${result.id}`}
                  id={`${SEARCH_RESULTS_LIST_ID}-option-${index}`}
                  className={`p-3 search-result-item${effectiveActiveIndex === index ? ' active' : ''}`}
                  role="option"
                  aria-selected={effectiveActiveIndex === index}
                  onMouseEnter={() => setActiveIndex(index)}
                  onClick={handlePostResultClick}
                >
                  <PostListItem post={result} />
                </ListGroup.Item>
              ))}
              <ListGroup.Item
                as={Link}
                action
                id={`${SEARCH_RESULTS_LIST_ID}-option-${searchResults.length}`}
                className={`py-3 d-flex align-items-center search-view-all${
                  effectiveActiveIndex === searchResults.length ? ' active' : ''
                }`}
                role="option"
                aria-selected={effectiveActiveIndex === searchResults.length}
                href={`/search?q=${encodeURIComponent(normalizedQuery)}`}
                onMouseEnter={() => setActiveIndex(searchResults.length)}
                onClick={handleViewAllResults}
              >
                <FontAwesomeIcon icon="search" className="me-2" />
                {t('common.viewAllResults', { query: normalizedQuery })}
              </ListGroup.Item>
            </>
          ) : (
            <ListGroup.Item className="text-center text-muted py-3 search-no-results">
              <FontAwesomeIcon icon="exclamation-circle" className="me-2" />
              {t('common.noResults')}
            </ListGroup.Item>
          )}
        </ListGroup>
      )}
    </div>
  );
}
