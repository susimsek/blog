import React, { useState, useRef, useEffect, useCallback } from 'react';
import ListGroup from 'react-bootstrap/ListGroup';
import SearchBar from '@/components/search/SearchBar';
import PostListItem from '@/components/posts/PostListItem';
import Link from '@/components/common/Link';
import { fetchPosts } from '@/lib/contentApi';
import useDebounce from '@/hooks/useDebounce';
import { defaultLocale } from '@/i18n/settings';
import { PostSummary } from '@/types/posts';
import { useTranslation } from 'react-i18next';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { useAppSelector } from '@/config/store';
import { useRouter } from 'next/navigation';

type ShortcutHint = {
  modifier: string;
  key: string;
};

interface SearchContainerProps {
  shortcutHint?: ShortcutHint;
}

const SEARCH_RESULTS_LIST_ID = 'header-search-results';

const normalizeSearchPosts = (posts: ReadonlyArray<unknown>): PostSummary[] =>
  posts.flatMap(post => {
    if (!post || typeof post !== 'object') {
      return [];
    }

    const candidate = post as Partial<PostSummary>;
    if (
      typeof candidate.id !== 'string' ||
      typeof candidate.title !== 'string' ||
      typeof candidate.publishedDate !== 'string' ||
      typeof candidate.summary !== 'string' ||
      typeof candidate.searchText !== 'string' ||
      typeof candidate.readingTimeMin !== 'number' ||
      !Number.isFinite(candidate.readingTimeMin) ||
      candidate.readingTimeMin <= 0 ||
      (candidate.updatedDate !== undefined && typeof candidate.updatedDate !== 'string') ||
      (candidate.thumbnail !== null && typeof candidate.thumbnail !== 'string') ||
      (candidate.topics !== undefined && !Array.isArray(candidate.topics)) ||
      (candidate.source !== undefined && candidate.source !== 'blog' && candidate.source !== 'medium')
    ) {
      return [];
    }

    return [
      {
        id: candidate.id,
        title: candidate.title,
        publishedDate: candidate.publishedDate,
        ...(typeof candidate.updatedDate === 'string' ? { updatedDate: candidate.updatedDate } : {}),
        summary: candidate.summary,
        searchText: candidate.searchText,
        thumbnail: candidate.thumbnail,
        topics: candidate.topics,
        readingTimeMin: candidate.readingTimeMin,
        source: candidate.source === 'medium' ? 'medium' : 'blog',
        ...(typeof candidate.link === 'string' ? { link: candidate.link } : {}),
      },
    ];
  });

export default function SearchContainer({ shortcutHint }: Readonly<SearchContainerProps>) {
  const { t } = useTranslation('common');
  const router = useRouter();
  const locale = useAppSelector(state => state.postsQuery.locale) ?? defaultLocale;
  const [searchQuery, setSearchQuery] = useState('');
  const [showResults, setShowResults] = useState(false);
  const [isLoadingResults, setIsLoadingResults] = useState(false);
  const [searchResults, setSearchResults] = useState<PostSummary[]>([]);
  const [activeIndex, setActiveIndex] = useState(-1);
  const searchRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const normalizedQuery = searchQuery.trim();
  const debouncedQuery = useDebounce(normalizedQuery, 250);
  const shouldRenderResults = showResults && normalizedQuery.length >= 2;
  const isWaitingForResults = shouldRenderResults && (debouncedQuery !== normalizedQuery || isLoadingResults);

  const selectableCount = searchResults.length > 0 ? searchResults.length + 1 : 0;
  const effectiveActiveIndex =
    shouldRenderResults && activeIndex >= 0 && activeIndex < selectableCount ? activeIndex : -1;
  const activeDescendantId =
    effectiveActiveIndex >= 0 ? `${SEARCH_RESULTS_LIST_ID}-option-${effectiveActiveIndex}` : undefined;

  const handleSearch = (query: string) => {
    const trimmedQuery = query.trim();
    setSearchQuery(query);
    setShowResults(trimmedQuery.length > 0);
    setActiveIndex(-1);
    if (trimmedQuery.length >= 2) {
      setSearchResults([]);
      setIsLoadingResults(true);
      return;
    }
    setIsLoadingResults(false);
    if (trimmedQuery.length === 0) {
      setSearchResults([]);
    }
  };

  useEffect(() => {
    if (!showResults || normalizedQuery.length < 2 || debouncedQuery.length < 2) {
      return;
    }

    const controller = new AbortController();

    const loadSearchResults = async () => {
      const payload = await fetchPosts(
        locale,
        {
          q: debouncedQuery,
          page: 1,
          size: 20,
          sort: 'desc',
          source: 'all',
        },
        { signal: controller.signal },
      );

      if (controller.signal.aborted) {
        return;
      }

      if (!payload || payload.status !== 'success' || !Array.isArray(payload.posts)) {
        setSearchResults([]);
        setIsLoadingResults(false);
        return;
      }

      const normalizedPosts = normalizeSearchPosts(payload.posts);
      const blogPosts = normalizedPosts.filter(post => (post.source ?? 'blog') === 'blog');
      const mediumPosts = normalizedPosts.filter(post => (post.source ?? 'blog') === 'medium');
      setSearchResults([...blogPosts, ...mediumPosts].slice(0, 5));
      setIsLoadingResults(false);
    };

    void loadSearchResults();

    return () => {
      controller.abort();
    };
  }, [debouncedQuery, locale, normalizedQuery, showResults]);

  const handleClickOutside = useCallback((event: MouseEvent) => {
    if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
      setShowResults(false);
    }
  }, []);

  const handleViewAllResults = () => {
    setShowResults(false);
    setActiveIndex(-1);
    setIsLoadingResults(false);
  };

  const handlePostResultClick = () => {
    setShowResults(false);
    setSearchQuery('');
    setActiveIndex(-1);
    setSearchResults([]);
    setIsLoadingResults(false);
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
      setIsLoadingResults(false);
      if (shouldClearQuery) {
        setSearchQuery('');
        setActiveIndex(-1);
        setSearchResults([]);
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
        shortcutHint={shortcutHint}
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
          ) : !isWaitingForResults ? (
            <ListGroup.Item className="text-center text-muted py-3 search-no-results">
              <FontAwesomeIcon icon="exclamation-circle" className="me-2" />
              {t('common.noResults')}
            </ListGroup.Item>
          ) : (
            <ListGroup.Item className="text-center text-muted py-3 search-no-results">
              <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true" />
              <span className="visually-hidden">{t('common.sidebar.loading')}</span>
            </ListGroup.Item>
          )}
        </ListGroup>
      )}
    </div>
  );
}
