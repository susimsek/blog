import React, { ReactNode, useState, useEffect } from 'react';
import Header from '@/components/common/Header';
import Footer from '@/components/common/Footer';
import Sidebar from '@/components/common/Sidebar';
import { Container, Row, Col } from 'react-bootstrap';
import { PostSummary, Topic } from '@/types/posts';
import useMediaQuery from '@/hooks/useMediaQuery';

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

  useEffect(() => {
    setIsSidebarVisible(sidebarEnabled && !isMobile);
  }, [isMobile]);

  const toggleSidebar = () => setIsSidebarVisible(prev => !prev);

  return (
    <>
      <Header
        posts={posts}
        searchEnabled={searchEnabled}
        sidebarEnabled={sidebarEnabled}
        onSidebarToggle={toggleSidebar}
      />
      <main>
        <Row>
          {/* Sidebar */}
          {isSidebarVisible && (
            <Col xs={12} md={3}>
              <Sidebar
                topics={topics}
                isMobile={isMobile}
                isVisible={isSidebarVisible}
                onClose={() => setIsSidebarVisible(false)}
              />
            </Col>
          )}
          {/* Main Content */}
          <Col xs={12} md={!isMobile && isSidebarVisible ? 9 : 12}>
            <Container className="py-5">{children}</Container>
          </Col>
        </Row>
      </main>
      <Footer />
    </>
  );
};

export default Layout;
