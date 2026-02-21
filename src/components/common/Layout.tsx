import React, { ReactNode, useState, useEffect, useRef } from 'react';
import Header from '@/components/common/Header';
import Footer from '@/components/common/Footer';
import Container from 'react-bootstrap/Container';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import { LayoutPostSummary, Topic } from '@/types/posts';
import useMediaQuery from '@/hooks/useMediaQuery';
import { GoogleAnalytics } from '@next/third-parties/google';
import { GA_ID } from '@/config/constants';
import { useAppDispatch, useAppSelector } from '@/config/store';
import { useParams } from 'next/navigation';
import { defaultLocale } from '@/i18n/settings';
import { setLocale, setTopics, setTopicsLoading } from '@/reducers/postsQuery';
import PreFooter from '@/components/common/PreFooter';
import dynamic from 'next/dynamic';

const Sidebar = dynamic(() => import('@/components/common/Sidebar'));

type LayoutProps = {
  children: ReactNode;
  posts?: LayoutPostSummary[];
  topics?: Topic[];
  preFooterTopTopics?: Topic[];
  searchEnabled?: boolean;
  sidebarEnabled?: boolean;
};

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

type LayoutStateInitializerProps = {
  topics: Topic[];
};

const LayoutStateInitializer: React.FC<LayoutStateInitializerProps> = ({ topics }) => {
  const dispatch = useAppDispatch();
  const params = useParams<{ locale?: string | string[] }>();
  const routeLocale = Array.isArray(params?.locale) ? params?.locale[0] : params?.locale;
  const currentLocale = routeLocale ?? defaultLocale;

  useEffect(() => {
    dispatch(setLocale(currentLocale));
  }, [currentLocale, dispatch]);

  useEffect(() => {
    dispatch(setTopics(normalizeSearchTopics(topics)));
    dispatch(setTopicsLoading(false));
  }, [currentLocale, dispatch, topics]);

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
  const isTopicsLoading = useAppSelector(state => state.postsQuery.topicsLoading);
  const sidebarTopics = fetchedTopics.length > 0 ? fetchedTopics : topics;
  const shouldShowTopicsLoading = isTopicsLoading && sidebarTopics.length === 0;
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
                topics={sidebarTopics}
                isLoading={shouldShowTopicsLoading}
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
            topics={sidebarTopics}
            isLoading={shouldShowTopicsLoading}
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
      <LayoutStateInitializer topics={props.topics ?? []} />
      <LayoutView {...props} />
    </>
  );
};

export default Layout;
