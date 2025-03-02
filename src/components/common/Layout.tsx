import React, { ReactNode, useState, useEffect, useRef } from 'react';
import Header from '@/components/common/Header';
import Footer from '@/components/common/Footer';
import Sidebar from '@/components/common/Sidebar';
import { Container, Row, Col } from 'react-bootstrap';
import { PostSummary, Topic } from '@/types/posts';
import useMediaQuery from '@/hooks/useMediaQuery';
import { GoogleAnalytics } from '@next/third-parties/google';
import { GA_ID } from '@/config/constants';

type LayoutProps = {
  children: ReactNode;
  posts?: PostSummary[];
  topics?: Topic[];
  searchEnabled?: boolean;
  sidebarEnabled?: boolean;
};

const Layout: React.FC<LayoutProps> = ({
  children,
  posts = [],
  topics = [],
  searchEnabled = false,
  sidebarEnabled = false,
}) => {
  const isMobile = useMediaQuery('(max-width: 768px)');
  const [isSidebarVisible, setIsSidebarVisible] = useState(sidebarEnabled);
  const footerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setIsSidebarVisible(sidebarEnabled && !isMobile);
  }, [isMobile, sidebarEnabled]);

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

  const toggleSidebar = () => setIsSidebarVisible(prev => !prev);

  return (
    <div className="d-flex flex-column min-vh-100">
      <GoogleAnalytics gaId={GA_ID} />
      <Header
        posts={posts}
        searchEnabled={searchEnabled}
        sidebarEnabled={sidebarEnabled}
        onSidebarToggle={toggleSidebar}
      />
      <main className="flex-grow-1">
        <Row>
          {/* Sidebar */}
          {isSidebarVisible && (
            <Col xs={12} md={4} lg={3}>
              <Sidebar
                topics={topics}
                isMobile={isMobile}
                isVisible={isSidebarVisible}
                onClose={() => setIsSidebarVisible(false)}
              />
            </Col>
          )}
          {/* Main Content */}
          <Col xs={12} md={isSidebarVisible ? 8 : 12} lg={isSidebarVisible ? 9 : 12}>
            <Container className="py-5">{children}</Container>
          </Col>
        </Row>
      </main>
      <div ref={footerRef}>
        <Footer />
      </div>
    </div>
  );
};

export default Layout;
