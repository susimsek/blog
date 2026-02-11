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
import { useAppDispatch } from '@/config/store';
import { useParams } from 'next/navigation';
import { defaultLocale } from '@/i18n/settings';
import { setPosts, setLocale } from '@/reducers/postsQuery';
import PreFooter from '@/components/common/PreFooter';
import dynamic from 'next/dynamic';
import { withBasePath } from '@/lib/basePath';
import { calculateReadingTime } from '@/lib/readingTime';

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
  locale: string,
  post: Pick<PostSummary, 'id' | 'title' | 'date'> & Partial<Omit<PostSummary, 'id' | 'title' | 'date'>>,
): PostSummary => {
  const summary = typeof post.summary === 'string' ? post.summary : '';
  const readingTime =
    typeof post.readingTime === 'string' && post.readingTime.trim().length > 0
      ? post.readingTime
      : calculateReadingTime(`${post.title} ${summary}`.trim(), locale);

  return {
    id: post.id,
    title: post.title,
    date: post.date,
    summary,
    thumbnail: post.thumbnail === null || typeof post.thumbnail === 'string' ? post.thumbnail : null,
    topics: Array.isArray(post.topics) ? post.topics : [],
    readingTime,
    ...(typeof post.link === 'string' ? { link: post.link } : {}),
  };
};

const normalizeSearchPosts = (posts: ReadonlyArray<unknown>, locale: string): PostSummary[] =>
  posts.flatMap(post => {
    if (!post || typeof post !== 'object') {
      return [];
    }

    const candidate = post as Partial<PostSummary>;
    if (typeof candidate.id !== 'string' || typeof candidate.title !== 'string' || typeof candidate.date !== 'string') {
      return [];
    }

    return [
      normalizeSearchPost(locale, { ...candidate, id: candidate.id, title: candidate.title, date: candidate.date }),
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
        if (!response.ok) {
          return;
        }

        const payload = (await response.json()) as unknown;
        if (!Array.isArray(payload)) {
          return;
        }

        const normalized = normalizeSearchPosts(payload, currentLocale);
        if (normalized.length > 0) {
          dispatch(setPosts(normalized));
        }
      } catch (error) {
        if ((error as { name?: string })?.name === 'AbortError') {
          return;
        }
      }
    };

    void loadPublicPosts();

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
                topics={topics}
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
