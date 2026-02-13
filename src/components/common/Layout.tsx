import React, { ReactNode, useState, useEffect, useRef } from 'react';
import Header from '@/components/common/Header';
import Footer from '@/components/common/Footer';
import Container from 'react-bootstrap/Container';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import { LayoutPostSummary, PostSummary, Topic } from '@/types/posts';
import useMediaQuery from '@/hooks/useMediaQuery';
import { GoogleAnalytics } from '@next/third-parties/google';
import { GA_ID } from '@/config/constants';
import { useAppDispatch, useAppSelector } from '@/config/store';
import { useParams } from 'next/navigation';
import { defaultLocale } from '@/i18n/settings';
import { setPosts, setLocale, setTopics } from '@/reducers/postsQuery';
import PreFooter from '@/components/common/PreFooter';
import dynamic from 'next/dynamic';
import { withBasePath } from '@/lib/basePath';

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
    Partial<Pick<PostSummary, 'topics' | 'link' | 'source'>>,
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
    source: post.source === 'medium' ? 'medium' : 'blog',
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
      (candidate.topics !== undefined && !Array.isArray(candidate.topics)) ||
      (candidate.source !== undefined && candidate.source !== 'blog' && candidate.source !== 'medium')
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
        source: candidate.source === 'medium' ? 'medium' : 'blog',
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

const LayoutStateInitializer: React.FC = () => {
  const dispatch = useAppDispatch();
  const params = useParams<{ locale?: string | string[] }>();
  const routeLocale = Array.isArray(params?.locale) ? params?.locale[0] : params?.locale;
  const currentLocale = routeLocale ?? defaultLocale;

  useEffect(() => {
    dispatch(setLocale(currentLocale));
  }, [currentLocale, dispatch]);

  useEffect(() => {
    const controller = new AbortController();

    const loadPublicPosts = async () => {
      try {
        const response = await fetch(withBasePath(`/data/posts.${currentLocale}.json`), {
          signal: controller.signal,
        });
        const payload = response.ok ? ((await response.json()) as unknown) : [];
        const normalizedPosts = Array.isArray(payload) ? normalizeSearchPosts(payload) : [];
        dispatch(setPosts(normalizedPosts));
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
  }, [currentLocale, dispatch]);

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
  const isMobile = useMediaQuery('(max-width: 991px)');
  const [isDesktopSidebarOpen, setIsDesktopSidebarOpen] = useState(true);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const footerRef = useRef<HTMLDivElement>(null);

  const isDesktopSidebarVisible = sidebarEnabled && !isMobile && isDesktopSidebarOpen;
  const isMobileSidebarVisible = sidebarEnabled && isMobile && isMobileSidebarOpen;

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

  const toggleSidebar = () => {
    if (isMobile) {
      setIsMobileSidebarOpen(previous => !previous);
      return;
    }
    setIsDesktopSidebarOpen(previous => !previous);
  };

  return (
    <div className="d-flex flex-column min-vh-100">
      {GA_ID ? <GoogleAnalytics gaId={GA_ID} /> : null}
      <Header searchEnabled={searchEnabled} sidebarEnabled={sidebarEnabled} onSidebarToggle={toggleSidebar} />
      <main className="flex-grow-1">
        <Row className="g-0">
          {/* Sidebar */}
          {isDesktopSidebarVisible && (
            <Col xs={12} md={4} lg={3}>
              <Sidebar
                topics={fetchedTopics}
                isMobile={isMobile}
                isVisible={isDesktopSidebarVisible}
                onClose={() => setIsDesktopSidebarOpen(false)}
              />
            </Col>
          )}
          {/* Main Content */}
          <Col xs={12} md={isDesktopSidebarVisible ? 8 : 12} lg={isDesktopSidebarVisible ? 9 : 12}>
            <Container className="content-shell content-shell-inner">{children}</Container>
          </Col>
        </Row>
        {sidebarEnabled && isMobile && isMobileSidebarVisible && (
          <Sidebar
            topics={fetchedTopics}
            isMobile={isMobile}
            isVisible={isMobileSidebarVisible}
            onClose={() => setIsMobileSidebarOpen(false)}
          />
        )}
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
