import React, { ReactNode, useState, useEffect, useRef } from 'react';
import Header from '@/components/common/Header';
import Footer from '@/components/common/Footer';
import Container from 'react-bootstrap/Container';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import { LayoutPostSummary, PostSummary, Topic } from '@/types/posts';
import useMediaQuery from '@/hooks/useMediaQuery';
import { GoogleAnalytics } from '@next/third-parties/google';
import { GA_ID, TOPIC_COLORS } from '@/config/constants';
import { useAppDispatch, useAppSelector } from '@/config/store';
import { useParams, usePathname } from 'next/navigation';
import { defaultLocale } from '@/i18n/settings';
import { setPosts, setLocale, setTopics } from '@/reducers/postsQuery';
import PreFooter from '@/components/common/PreFooter';
import dynamic from 'next/dynamic';
import { withBasePath } from '@/lib/basePath';
import { buildPostSearchText } from '@/lib/searchText';

const Sidebar = dynamic(() => import('@/components/common/Sidebar'));

type LayoutProps = {
  children: ReactNode;
  posts?: LayoutPostSummary[];
  topics?: Topic[];
  preFooterTopTopics?: Topic[];
  searchEnabled?: boolean;
  sidebarEnabled?: boolean;
};

const normalizeSearchPost = (
  post: Pick<PostSummary, 'id' | 'title' | 'date' | 'summary' | 'searchText' | 'readingTimeMin' | 'thumbnail'> &
    Partial<Pick<PostSummary, 'topics' | 'link'>>,
): PostSummary => {
  return {
    id: post.id,
    title: post.title,
    date: post.date,
    summary: post.summary,
    searchText: post.searchText,
    thumbnail: post.thumbnail,
    topics: post.topics,
    readingTimeMin: post.readingTimeMin,
    ...(typeof post.link === 'string' ? { link: post.link } : {}),
  };
};

const normalizeSearchPosts = (posts: ReadonlyArray<unknown>): PostSummary[] =>
  posts.flatMap(post => {
    if (!post || typeof post !== 'object') {
      return [];
    }

    const candidate = post as Partial<PostSummary>;
    if (
      typeof candidate.id !== 'string' ||
      typeof candidate.title !== 'string' ||
      typeof candidate.date !== 'string' ||
      typeof candidate.summary !== 'string' ||
      typeof candidate.readingTimeMin !== 'number' ||
      !Number.isFinite(candidate.readingTimeMin) ||
      candidate.readingTimeMin <= 0 ||
      typeof candidate.searchText !== 'string' ||
      (candidate.thumbnail !== null && typeof candidate.thumbnail !== 'string') ||
      (candidate.topics !== undefined && !Array.isArray(candidate.topics))
    ) {
      return [];
    }

    return [
      normalizeSearchPost({
        ...candidate,
        id: candidate.id,
        title: candidate.title,
        date: candidate.date,
        summary: candidate.summary,
        thumbnail: candidate.thumbnail,
        topics: candidate.topics,
        readingTimeMin: candidate.readingTimeMin,
        searchText: candidate.searchText,
        ...(typeof candidate.link === 'string' ? { link: candidate.link } : {}),
      }),
    ];
  });

const normalizeSearchTopics = (topics: ReadonlyArray<unknown>): Topic[] =>
  topics.flatMap(topic => {
    if (!topic || typeof topic !== 'object') {
      return [];
    }

    const candidate = topic as Partial<Topic>;
    if (typeof candidate.id !== 'string' || typeof candidate.name !== 'string' || typeof candidate.color !== 'string') {
      return [];
    }

    return [
      {
        id: candidate.id,
        name: candidate.name,
        color: candidate.color,
        ...(typeof candidate.link === 'string' ? { link: candidate.link } : {}),
      },
    ];
  });

const MEDIUM_WHITESPACE_CHARS = new Set([' ', '\n', '\r', '\t', '\f', '\v']);

const collapseMediumWhitespace = (value: string): string => {
  let result = '';
  let inWhitespace = false;

  for (const char of value) {
    if (MEDIUM_WHITESPACE_CHARS.has(char)) {
      if (!inWhitespace) {
        result += ' ';
        inWhitespace = true;
      }
    } else {
      inWhitespace = false;
      result += char;
    }
  }

  return result.trim();
};

const stripMediumHtml = (html: string): string => {
  let result = '';
  let insideTag = false;

  for (const char of html) {
    if (char === '<') {
      insideTag = true;
      continue;
    }

    if (char === '>') {
      insideTag = false;
      result += ' ';
      continue;
    }

    if (!insideTag) {
      result += char;
    }
  }

  return collapseMediumWhitespace(result);
};

const extractAttributeValue = (tag: string, attribute: string): string | null => {
  const lowerTag = tag.toLowerCase();
  const attributePattern = `${attribute.toLowerCase()}=`;
  const attrIndex = lowerTag.indexOf(attributePattern);

  if (attrIndex === -1) {
    return null;
  }

  let valueStart = attrIndex + attributePattern.length;
  const quoteChar = tag[valueStart];
  let valueEnd: number;

  if (quoteChar === '"' || quoteChar === "'") {
    valueStart += 1;
    valueEnd = tag.indexOf(quoteChar, valueStart);
    if (valueEnd === -1) {
      return null;
    }
    return tag.slice(valueStart, valueEnd);
  }

  valueEnd = valueStart;
  while (valueEnd < tag.length && !MEDIUM_WHITESPACE_CHARS.has(tag[valueEnd]) && tag[valueEnd] !== '>') {
    valueEnd += 1;
  }

  return tag.slice(valueStart, valueEnd);
};

const extractFirstImage = (html: string): string | null => {
  const lowerHtml = html.toLowerCase();
  let searchIndex = 0;

  while (searchIndex < lowerHtml.length) {
    const imgIndex = lowerHtml.indexOf('<img', searchIndex);
    if (imgIndex === -1) {
      return null;
    }

    const tagEnd = lowerHtml.indexOf('>', imgIndex);
    if (tagEnd === -1) {
      return null;
    }

    const tag = html.slice(imgIndex, tagEnd + 1);
    const srcValue = extractAttributeValue(tag, 'src');
    if (srcValue) {
      return srcValue;
    }

    searchIndex = tagEnd + 1;
  }

  return null;
};

const calculateMediumReadingTimeMin = (html: string): number => {
  const wordCount = stripMediumHtml(html).split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.ceil(wordCount / 265));
};

const getColorForTopic = (topic: string): (typeof TOPIC_COLORS)[number] => {
  let hash = 0;
  for (const char of topic) {
    hash = (char.codePointAt(0) ?? 0) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % TOPIC_COLORS.length;
  return TOPIC_COLORS[index];
};

const normalizeMediumFeedPosts = (payload: unknown): PostSummary[] => {
  if (!payload || typeof payload !== 'object') {
    return [];
  }

  const items = Array.isArray((payload as { items?: unknown }).items)
    ? ((payload as { items: unknown[] }).items ?? [])
    : [];

  return items.flatMap((item, index) => {
    if (!item || typeof item !== 'object') {
      return [];
    }

    const candidate = item as {
      guid?: unknown;
      title?: unknown;
      pubDate?: unknown;
      link?: unknown;
      content?: unknown;
      ['content:encoded']?: unknown;
      ['content:encodedSnippet']?: unknown;
      categories?: unknown;
    };

    const content =
      typeof candidate['content:encoded'] === 'string'
        ? candidate['content:encoded']
        : typeof candidate.content === 'string'
          ? candidate.content
          : '';
    const rawSummary =
      typeof candidate['content:encodedSnippet'] === 'string'
        ? candidate['content:encodedSnippet']
        : stripMediumHtml(content);
    const summary = rawSummary.length > 200 ? `${rawSummary.slice(0, 200)}...` : rawSummary;

    const categories = Array.isArray(candidate.categories)
      ? candidate.categories.filter(
          (category): category is string => typeof category === 'string' && category.length > 0,
        )
      : [];

    return [
      {
        id: typeof candidate.guid === 'string' && candidate.guid.length > 0 ? candidate.guid : `rss-${index}`,
        title: typeof candidate.title === 'string' && candidate.title.length > 0 ? candidate.title : 'Untitled',
        date:
          typeof candidate.pubDate === 'string' && candidate.pubDate.length > 0
            ? candidate.pubDate
            : new Date().toISOString(),
        summary,
        searchText: buildPostSearchText({
          id: typeof candidate.guid === 'string' && candidate.guid.length > 0 ? candidate.guid : `rss-${index}`,
          title: typeof candidate.title === 'string' && candidate.title.length > 0 ? candidate.title : 'Untitled',
          summary,
          topics: categories.map(category => ({ id: category, name: category, color: getColorForTopic(category) })),
        }),
        thumbnail: extractFirstImage(content),
        topics: categories.map(category => ({
          id: category,
          name: category,
          color: getColorForTopic(category),
          link: `https://medium.com/tag/${category}`,
        })),
        readingTimeMin: calculateMediumReadingTimeMin(content),
        ...(typeof candidate.link === 'string' ? { link: candidate.link } : {}),
      },
    ];
  });
};

const LayoutStateInitializer: React.FC = () => {
  const dispatch = useAppDispatch();
  const params = useParams<{ locale?: string | string[] }>();
  const pathname = usePathname() ?? '';
  const routeLocale = Array.isArray(params?.locale) ? params?.locale[0] : params?.locale;
  const currentLocale = routeLocale ?? defaultLocale;
  const isMediumRoute = /(?:^|\/)medium(?:\/|$)/.test(pathname);

  useEffect(() => {
    dispatch(setLocale(currentLocale));
  }, [currentLocale, dispatch]);

  useEffect(() => {
    const controller = new AbortController();

    const loadPublicPosts = async () => {
      try {
        const response = await fetch(
          withBasePath(isMediumRoute ? '/data/medium-feed.json' : `/data/posts.${currentLocale}.json`),
          {
            signal: controller.signal,
          },
        );
        if (!response.ok) {
          dispatch(setPosts([]));
          return;
        }

        const payload = (await response.json()) as unknown;
        const normalized = isMediumRoute
          ? normalizeMediumFeedPosts(payload)
          : Array.isArray(payload)
            ? normalizeSearchPosts(payload)
            : [];
        dispatch(setPosts(normalized));
      } catch (error) {
        if ((error as { name?: string })?.name === 'AbortError') {
          return;
        }
        dispatch(setPosts([]));
      }
    };

    const loadPublicTopics = async () => {
      try {
        const response = await fetch(withBasePath(`/data/topics.${currentLocale}.json`), {
          signal: controller.signal,
        });
        if (!response.ok) {
          dispatch(setTopics([]));
          return;
        }

        const payload = (await response.json()) as unknown;
        if (!Array.isArray(payload)) {
          dispatch(setTopics([]));
          return;
        }

        const normalized = normalizeSearchTopics(payload);
        dispatch(setTopics(normalized));
      } catch (error) {
        if ((error as { name?: string })?.name === 'AbortError') {
          return;
        }
        dispatch(setTopics([]));
      }
    };

    void Promise.all([loadPublicPosts(), loadPublicTopics()]);

    return () => {
      controller.abort();
    };
  }, [currentLocale, dispatch, isMediumRoute]);

  return null;
};

const LayoutView: React.FC<LayoutProps> = ({
  children,
  posts = [],
  topics = [],
  preFooterTopTopics = [],
  searchEnabled = false,
  sidebarEnabled = false,
}) => {
  const fetchedTopics = useAppSelector(state => state.postsQuery.topics);
  const isMobile = useMediaQuery('(max-width: 768px)');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const footerRef = useRef<HTMLDivElement>(null);

  const isSidebarVisible = sidebarEnabled && !isMobile && isSidebarOpen;

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          document.body.classList.add('footer-visible');
        } else {
          document.body.classList.remove('footer-visible');
        }
      },
      { threshold: 0.1 },
    );

    const currentFooterRef = footerRef.current;

    if (currentFooterRef) {
      observer.observe(currentFooterRef);
    }

    return () => {
      if (currentFooterRef) {
        observer.unobserve(currentFooterRef);
      }
    };
  }, []);

  const toggleSidebar = () => setIsSidebarOpen(prev => !prev);

  return (
    <div className="d-flex flex-column min-vh-100">
      {GA_ID ? <GoogleAnalytics gaId={GA_ID} /> : null}
      <Header searchEnabled={searchEnabled} sidebarEnabled={sidebarEnabled} onSidebarToggle={toggleSidebar} />
      <main className="flex-grow-1">
        <Row className="g-0">
          {/* Sidebar */}
          {isSidebarVisible && (
            <Col xs={12} md={4} lg={3}>
              <Sidebar
                topics={fetchedTopics}
                isMobile={isMobile}
                isVisible={isSidebarVisible}
                onClose={() => setIsSidebarOpen(false)}
              />
            </Col>
          )}
          {/* Main Content */}
          <Col xs={12} md={isSidebarVisible ? 8 : 12} lg={isSidebarVisible ? 9 : 12}>
            <Container className="content-shell content-shell-inner">{children}</Container>
          </Col>
        </Row>
      </main>
      <PreFooter posts={posts} topics={topics} topTopics={preFooterTopTopics} />
      <div ref={footerRef}>
        <Footer />
      </div>
    </div>
  );
};

const Layout: React.FC<LayoutProps> = props => {
  return (
    <>
      <LayoutStateInitializer />
      <LayoutView {...props} />
    </>
  );
};

export default Layout;
