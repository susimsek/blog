import React, { ReactNode, useState, useEffect, useRef } from 'react';
import Header from '@/components/common/Header';
import Footer from '@/components/common/Footer';
import Sidebar from '@/components/common/Sidebar';
import Container from 'react-bootstrap/Container';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import { PostSummary, Topic } from '@/types/posts';
import useMediaQuery from '@/hooks/useMediaQuery';
import { GoogleAnalytics } from '@next/third-parties/google';
import { GA_ID } from '@/config/constants';
import { useAppDispatch } from '@/config/store';
import { useParams } from 'next/navigation';
import { defaultLocale } from '@/i18n/settings';
import { setPosts, setLocale } from '@/reducers/postsQuery';
import PreFooter from '@/components/common/PreFooter';

type LayoutProps = {
  children: ReactNode;
  posts?: PostSummary[];
  topics?: Topic[];
  preFooterTopTopics?: Topic[];
  searchEnabled?: boolean;
  sidebarEnabled?: boolean;
};

const LayoutStateInitializer: React.FC<Pick<LayoutProps, 'posts'>> = ({ posts = [] }) => {
  const dispatch = useAppDispatch();
  const params = useParams<{ locale?: string | string[] }>();
  const routeLocale = Array.isArray(params?.locale) ? params?.locale[0] : params?.locale;

  useEffect(() => {
    dispatch(setPosts(posts));
  }, [dispatch, posts]);

  useEffect(() => {
    const currentLocale = routeLocale ?? defaultLocale ?? null;
    dispatch(setLocale(currentLocale));
  }, [dispatch, routeLocale]);

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
            <Container className="content-shell py-5">{children}</Container>
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
      <LayoutStateInitializer posts={props.posts} />
      <LayoutView {...props} />
    </>
  );
};

export default Layout;
