import React, { useState, useEffect } from 'react';
import { Topic } from '@/types/posts';
import { Nav, Offcanvas } from 'react-bootstrap';
import Link from '@/components/common/Link';
import SearchBar from '@/components/search/SearchBar';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { useTranslation } from 'next-i18next';
import useMediaQuery from '@/hooks/useMediaQuery';
import { ReactComponent as Logo } from '@assets/images/logo.svg';

type SidebarProps = {
  topics?: Topic[];
  onClose: () => void;
};

const Sidebar: React.FC<SidebarProps> = ({ topics = [], onClose }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [showCanvas, setShowCanvas] = useState(false);
  const { t } = useTranslation();
  const isMobile = useMediaQuery('(max-width: 768px)');

  useEffect(() => {
    if (isMobile) {
      setShowCanvas(true);
    } else {
      setShowCanvas(false);
    }
  }, [isMobile]);

  const handleLinkClick = () => {
    setShowCanvas(false);
    onClose(); // Sidebar kapatılır
  };

  const filteredTopics = topics.filter(topic => topic.name.toLowerCase().includes(searchQuery.toLowerCase()));

  const renderTopics = () =>
    filteredTopics.length > 0 ? (
      filteredTopics.map(topic => (
        <Nav.Link as={Link} key={topic.id} href={`/topics/${topic.id}`} className="px-4 py-2" onClick={handleLinkClick}>
          {topic.name}
        </Nav.Link>
      ))
    ) : (
      <div className="d-flex align-items-center text-muted px-4 py-2">
        <FontAwesomeIcon icon="exclamation-circle" className="me-2" />
        {t('topic:topic.noTopicFound')}
      </div>
    );

  return (
    <>
      {isMobile ? (
        <Offcanvas show={showCanvas} onHide={onClose} placement="start">
          <Offcanvas.Header closeButton={false}>
            <div className="d-flex align-items-center brand">
              <Link href="/" onClick={handleLinkClick}>
                <Logo width={40} height={40} className="rounded-circle" />
              </Link>
              <span className="ms-2 fw-bold">{t('common:common.sidebar.title')}</span>
            </div>
            <button
              type="button"
              className="btn-close-custom position-absolute top-0 end-0 m-3"
              aria-label="Close"
              onClick={onClose}
            >
              <FontAwesomeIcon icon="times" style={{ fontSize: '1.5rem' }} />
            </button>
          </Offcanvas.Header>
          <Offcanvas.Body>
            <div className="d-flex px-4 mb-3">
              <SearchBar query={searchQuery} onChange={setSearchQuery} className="flex-grow-1" />
            </div>
            <Nav className="d-flex flex-column">{renderTopics()}</Nav>
          </Offcanvas.Body>
        </Offcanvas>
      ) : (
        <Nav className="sidebar py-4 flex-column">
          <h5 className="fw-bold px-4 mb-3">{t('common:common.sidebar.title')}</h5>
          <div className="d-flex px-4 mb-3">
            <SearchBar query={searchQuery} onChange={setSearchQuery} className="flex-grow-1" />
          </div>
          {renderTopics()}
        </Nav>
      )}
    </>
  );
};

export default Sidebar;
