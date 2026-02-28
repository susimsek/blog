import React, { useState, useRef, useEffect, useCallback } from 'react';
import ListGroup from 'react-bootstrap/ListGroup';
import SearchBar from '@/components/search/SearchBar';
import PostListItem from '@/components/posts/PostListItem';
import Link from '@/components/common/Link';
import useDebounce from '@/hooks/useDebounce';
import { defaultLocale } from '@/i18n/settings';
import { PostSummary } from '@/types/posts';
import { useTranslation } from 'react-i18next';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { useAppSelector } from '@/config/store';
import { useRouter } from 'next/navigation';
import { withBasePath } from '@/lib/basePath';
import { normalizePostCategoryRef } from '@/lib/postCategoryRef';

type ShortcutHint = {
  modifier: string;
  key: string;
};

interface SearchContainerProps {
  shortcutHint?: ShortcutHint;
}

const SEARCH_RESULTS_LIST_ID = 'header-search-results';
const MAX_RESULTS = 5;
const localePostsCache = new Map<string, PostSummary[]>();
const localePostsPromiseCache = new Map<string, Promise<PostSummary[]>>();

export const __resetSearchContainerCacheForTests = () => {
  localePostsCache.clear();
  localePostsPromiseCache.clear();
};

export const normalizeSearchPosts = (posts: ReadonlyArray<unknown>): PostSummary[] =>
  posts.flatMap(post => {
    if (!post || typeof post !== 'object') {
      return [];
    }

    const candidate = post as Partial<PostSummary>;
    const normalizedCategory = normalizePostCategoryRef(candidate.category);
    if (
      typeof candidate.id !== 'string' ||
      typeof candidate.title !== 'string' ||
      typeof candidate.publishedDate !== 'string' ||
      typeof candidate.summary !== 'string' ||
      typeof candidate.searchText !== 'string' ||
      typeof candidate.readingTimeMin !== 'number' ||
      !Number.isFinite(candidate.readingTimeMin) ||
      candidate.readingTimeMin <= 0 ||
      (candidate.updatedDate !== undefined &&
        candidate.updatedDate !== null &&
        typeof candidate.updatedDate !== 'string') ||
      (candidate.thumbnail !== null && typeof candidate.thumbnail !== 'string') ||
      (candidate.topics !== undefined && candidate.topics !== null && !Array.isArray(candidate.topics)) ||
      (candidate.source !== undefined &&
        candidate.source !== null &&
        candidate.source !== 'blog' &&
        candidate.source !== 'medium')
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
        ...(normalizedCategory?.id && normalizedCategory.name ? { category: normalizedCategory } : {}),
        topics: Array.isArray(candidate.topics) ? candidate.topics : undefined,
        readingTimeMin: candidate.readingTimeMin,
        source: candidate.source === 'medium' ? 'medium' : 'blog',
        ...(typeof candidate.link === 'string' ? { link: candidate.link } : {}),
      },
    ];
  });

export const getStaticLocalePosts = async (locale: string): Promise<PostSummary[]> => {
  const normalizedLocale = locale.trim();
  if (normalizedLocale.length === 0) {
    return [];
  }

  const cachedPosts = localePostsCache.get(normalizedLocale);
  if (cachedPosts) {
    return cachedPosts;
  }

  const inFlightRequest = localePostsPromiseCache.get(normalizedLocale);
  if (inFlightRequest) {
    return inFlightRequest;
  }

  const request = (async () => {
    try {
      const response = await fetch(withBasePath(`/data/posts.${normalizedLocale}.json`), {
        cache: 'force-cache',
      });
      if (!response.ok) {
        return [];
      }

      const payload = (await response.json()) as unknown;
      const normalizedPosts = Array.isArray(payload) ? normalizeSearchPosts(payload) : [];
      localePostsCache.set(normalizedLocale, normalizedPosts);
      return normalizedPosts;
    } catch {
      return [];
    } finally {
      localePostsPromiseCache.delete(normalizedLocale);
    }
  })();

  localePostsPromiseCache.set(normalizedLocale, request);
  return request;
};

export const filterSearchResults = (posts: PostSummary[], query: string) => {
  const normalizedQuery = query.trim().toLowerCase();
  if (normalizedQuery.length === 0) {
    return [];
  }

  const filteredPosts = posts.filter(post => {
    const searchArea = `${post.title} ${post.summary} ${post.searchText}`.toLowerCase();
    return searchArea.includes(normalizedQuery);
  });
  const blogPosts = filteredPosts.filter(post => (post.source ?? 'blog') === 'blog');
  const mediumPosts = filteredPosts.filter(post => (post.source ?? 'blog') === 'medium');

  return [...blogPosts, ...mediumPosts].slice(0, MAX_RESULTS);
};

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

    let isMounted = true;

    const loadSearchResults = async () => {
      const localePosts = await getStaticLocalePosts(locale);

      if (!isMounted) {
        return;
      }

      setSearchResults(filterSearchResults(localePosts, debouncedQuery));
      setIsLoadingResults(false);
    };

    void loadSearchResults();

    return () => {
      isMounted = false;
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
        const targetIndex = Math.max(effectiveActiveIndex, 0);
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

    globalThis.addEventListener('app:search-focus', handleSearchFocus as EventListener);
    globalThis.addEventListener('app:search-close', handleSearchClose as EventListener);
    return () => {
      globalThis.removeEventListener('app:search-focus', handleSearchFocus as EventListener);
      globalThis.removeEventListener('app:search-close', handleSearchClose as EventListener);
    };
  }, [searchQuery]);

  let resultsContent: React.ReactNode;
  if (searchResults.length > 0) {
    resultsContent = (
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
    );
  } else if (isWaitingForResults) {
    resultsContent = (
      <ListGroup.Item className="text-center text-muted py-3 search-no-results">
        <span className="spinner-border spinner-border-sm" aria-hidden="true" />
        <output className="visually-hidden">{t('common.sidebar.loading')}</output>
      </ListGroup.Item>
    );
  } else {
    resultsContent = (
      <ListGroup.Item className="text-center text-muted py-3 search-no-results">
        <FontAwesomeIcon icon="exclamation-circle" className="me-2" />
        {t('common.noResults')}
      </ListGroup.Item>
    );
  }

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
          {resultsContent}
        </ListGroup>
      )}
    </div>
  );
}
