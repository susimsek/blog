import React, { useState, useMemo, useEffect } from 'react';
import { Topic } from '@/types/posts';
import { Nav, Offcanvas } from 'react-bootstrap';
import Link from '@/components/common/Link';
import SearchBar from '@/components/search/SearchBar';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { useTranslation } from 'next-i18next';
import { ReactComponent as Logo } from '@assets/images/logo.svg';
import Paginator from '@/components/pagination/Paginator';
import useDebounce from '@/hooks/useDebounce'; // Import the custom debounce hook

type SidebarProps = {
  topics?: Topic[];
  isMobile: boolean;
  isVisible: boolean;
  onClose: () => void;
  itemsPerPage?: number;
};

const Sidebar: React.FC<SidebarProps> = ({ topics = [], isMobile, isVisible, onClose, itemsPerPage = 10 }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const { t } = useTranslation();

  // Debounced search query
  const debouncedSearchQuery = useDebounce(searchQuery, 500); // 500ms debounce

  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearchQuery]);

  const filteredTopics = useMemo(
    () => topics.filter(topic => topic.name.toLowerCase().includes(debouncedSearchQuery.toLowerCase())),
    [topics, debouncedSearchQuery],
  );

  const totalPages = Math.ceil(filteredTopics.length / itemsPerPage);

  const currentTopics = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredTopics.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredTopics, currentPage, itemsPerPage]);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  // Optimize renderTopics with useMemo
  const renderTopics = useMemo(() => {
    return currentTopics.length > 0 ? (
      currentTopics.map(topic => (
        <Nav.Link as={Link} key={topic.id} href={`/topics/${topic.id}`} className="px-4 py-2">
          {topic.name}
        </Nav.Link>
      ))
    ) : (
      <div className="text-muted px-4 py-2">
        <FontAwesomeIcon icon="exclamation-circle" className="me-2" />
        {t('topic:topic.noTopicFound')}
      </div>
    );
  }, [currentTopics, t]);

  const sidebarContent = (
    <>
      <div className="d-flex px-4 mb-2">
        <SearchBar query={searchQuery} onChange={setSearchQuery} className="flex-grow-1" />
      </div>
      <Nav className="d-flex flex-column">{renderTopics}</Nav>
      {filteredTopics.length > 0 && (
        <div className="px-4 border-top">
          <div className="mt-4 text-muted mb-2 d-flex align-items-center">
            <FontAwesomeIcon icon="clipboard-list" className="me-2" />
            {t('common.pagination.showingResults', {
              start: (currentPage - 1) * itemsPerPage + 1,
              end: Math.min(currentPage * itemsPerPage, filteredTopics.length),
              total: filteredTopics.length,
            })}
          </div>
          <div className="d-flex justify-content-start">
            <Paginator
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={handlePageChange}
              maxPagesToShow={5}
            />
          </div>
        </div>
      )}
    </>
  );

  return isMobile ? (
    <Offcanvas show={isVisible} onHide={onClose} placement="start">
      <Offcanvas.Header closeButton={false}>
        <div className="d-flex align-items-center brand">
          <Link href="/" onClick={onClose}>
            <Logo width={40} height={40} className="rounded-circle me-2" />
          </Link>
          <h5 className="fw-bold m-0 d-flex align-items-center">{t('common:common.sidebar.title')}</h5>
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
    <Nav className="sidebar flex-column">
      <h5 className="fw-bold mt-4 px-4 mb-3">{t('common:common.sidebar.title')}</h5>
      {sidebarContent}
    </Nav>
  );
};

export default Sidebar;
