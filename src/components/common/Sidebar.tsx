import React, { useState, useMemo } from 'react';
import { Topic } from '@/types/posts';
import { Nav, Offcanvas } from 'react-bootstrap';
import Link from '@/components/common/Link';
import SearchBar from '@/components/search/SearchBar';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { useTranslation } from 'next-i18next';
import { ReactComponent as Logo } from '@assets/images/logo.svg';

type SidebarProps = {
  topics?: Topic[];
  isMobile: boolean;
  isVisible: boolean;
  onClose: () => void;
};

const Sidebar: React.FC<SidebarProps> = ({ topics = [], isMobile, isVisible, onClose }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const { t } = useTranslation();

  const filteredTopics = useMemo(
    () => topics.filter(topic => topic.name.toLowerCase().includes(searchQuery.toLowerCase())),
    [topics, searchQuery],
  );

  const renderTopics = () =>
    filteredTopics.length > 0 ? (
      filteredTopics.map(topic => (
        <Nav.Link as={Link} key={topic.id} href={`/topics/${topic.id}`} className="px-4 py-2" onClick={onClose}>
          {topic.name}
        </Nav.Link>
      ))
    ) : (
      <div className="text-muted px-4 py-2">
        <FontAwesomeIcon icon="exclamation-circle" className="me-2" />
        {t('topic:topic.noTopicFound')}
      </div>
    );

  const sidebarContent = (
    <>
      <div className="d-flex px-4 mb-3">
        <SearchBar query={searchQuery} onChange={setSearchQuery} className="flex-grow-1" />
      </div>
      <Nav className="d-flex flex-column">{renderTopics()}</Nav>
    </>
  );

  return isMobile ? (
    <Offcanvas show={isVisible} onHide={onClose} placement="start">
      <Offcanvas.Header closeButton={false}>
        <div className="d-flex align-items-center brand">
          <Link href="/" onClick={onClose}>
            <Logo width={40} height={40} className="rounded-circle me-2" />
          </Link>
          <h5 className="fw-bold m-0">{t('common:common.sidebar.title')}</h5>
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
      <Offcanvas.Body>{sidebarContent}</Offcanvas.Body>
    </Offcanvas>
  ) : (
    <Nav className="sidebar py-4 flex-column">
      <h5 className="fw-bold px-4 mb-3">{t('common:common.sidebar.title')}</h5>
      {sidebarContent}
    </Nav>
  );
};

export default Sidebar;
