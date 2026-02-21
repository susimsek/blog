import React, { useState, useMemo, useCallback } from 'react';
import { Topic } from '@/types/posts';
import Nav from 'react-bootstrap/Nav';
import Offcanvas from 'react-bootstrap/Offcanvas';
import Link from '@/components/common/Link';
import SearchBar from '@/components/search/SearchBar';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { useTranslation } from 'react-i18next';
import { SITE_LOGO } from '@/config/constants';
import useDebounce from '@/hooks/useDebounce';
import Image from 'next/image';
import { topicMatchesQuery } from '@/lib/searchText';

type SidebarProps = {
  topics?: Topic[];
  isLoading?: boolean;
  isMobile: boolean;
  isVisible: boolean;
  onClose: () => void;
};

const Sidebar: React.FC<SidebarProps> = ({ topics = [], isLoading = false, isMobile, isVisible, onClose }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const { t } = useTranslation();

  // Debounced search query
  const debouncedSearchQuery = useDebounce(searchQuery, 500);

  const filteredTopics = useMemo(
    () => topics.filter(topic => topicMatchesQuery(topic, debouncedSearchQuery)),
    [topics, debouncedSearchQuery],
  );

  const handleTopicClick = useCallback(() => {
    if (isMobile) {
      onClose();
    }
  }, [isMobile, onClose]);

  const renderTopics = useMemo(() => {
    if (isLoading) {
      return (
        <div className="text-muted px-4 py-2 d-flex align-items-center">
          <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true" />
          <span className="visually-hidden">Loading</span>
        </div>
      );
    }

    if (filteredTopics.length > 0) {
      return filteredTopics.map(topic => (
        <Nav.Link
          as={Link}
          key={topic.id}
          href={`/topics/${topic.id}`}
          className="px-4 py-2"
          onClick={handleTopicClick}
        >
          {topic.name}
        </Nav.Link>
      ));
    }

    return (
      <div className="text-muted px-4 py-2">
        <FontAwesomeIcon icon="exclamation-circle" className="me-2" />
        {t('topic:topic.noTopicFound')}
      </div>
    );
  }, [filteredTopics, handleTopicClick, isLoading, t]);

  const sidebarContent = (
    <div className="sidebar-content px-4 py-3">
      <h5 className="fw-bold mb-3">{t('common:common.sidebar.title')}</h5>
      <div className="sidebar-search mb-3">
        <SearchBar query={searchQuery} onChange={setSearchQuery} className="w-100" />
      </div>
      <div className="sidebar-topics">{renderTopics}</div>
    </div>
  );

  return isMobile ? (
    <Offcanvas show={isVisible} onHide={onClose} placement="start">
      <Offcanvas.Header closeButton={false}>
        <div className="d-flex align-items-center brand">
          <Link href="/" onClick={onClose}>
            <Image
              src={SITE_LOGO}
              alt={t('common:common.header.title')}
              width={40}
              height={40}
              className="rounded-circle me-2"
            />
          </Link>
          <h5 className="fw-bold m-0 d-flex align-items-center">{t('common:common.sidebar.title')}</h5>
        </div>
        <button
          type="button"
          className="btn-close-custom position-absolute top-0 end-0 m-3"
          aria-label="Close"
          onClick={onClose}
        >
          <FontAwesomeIcon icon="times" className="sidebar-close-icon" />
        </button>
      </Offcanvas.Header>
      <Offcanvas.Body className="sidebar">{sidebarContent}</Offcanvas.Body>
    </Offcanvas>
  ) : (
    <Nav className="sidebar flex-column">{sidebarContent}</Nav>
  );
};

export default Sidebar;
