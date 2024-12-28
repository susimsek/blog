import React, { ReactNode, useState } from 'react';
import Header from '@/components/common/Header';
import Footer from '@/components/common/Footer';
import Sidebar from '@/components/common/Sidebar';
import { Container, Row, Col } from 'react-bootstrap';
import { PostSummary, Topic } from '@/types/posts';

type LayoutProps = {
  children: ReactNode;
  posts?: PostSummary[];
  topics?: Topic[];
  searchEnabled?: boolean;
  sidebarEnabled?: boolean;
};

export default function Layout({
  children,
  posts = [],
  topics = [],
  searchEnabled = false,
  sidebarEnabled = false,
}: Readonly<LayoutProps>) {
  const [isSidebarVisible, setIsSidebarVisible] = useState(sidebarEnabled);

  const handleSidebarToggle = () => {
    setIsSidebarVisible(!isSidebarVisible);
  };

  const handleSidebarClose = () => {
    setIsSidebarVisible(false);
  };

  return (
    <>
      {/* Header with Sidebar Toggle */}
      <Header
        posts={posts}
        searchEnabled={searchEnabled}
        sidebarEnabled={sidebarEnabled}
        onSidebarToggle={handleSidebarToggle}
      />
      <main>
        <Row>
          {isSidebarVisible && (
            /* Sidebar */
            <Col xs={12} md={3} className="sidebar-container">
              <Sidebar topics={topics} onClose={handleSidebarClose} />
            </Col>
          )}

          {/* Main Content */}
          <Col xs={12} md={isSidebarVisible ? 9 : 12}>
            <Container className="py-5">{children}</Container>
          </Col>
        </Row>
      </main>
      <Footer />
    </>
  );
}
