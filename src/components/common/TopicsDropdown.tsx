import React, { useState } from 'react';
import { Dropdown, DropdownButton, Badge } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { useTranslation } from 'next-i18next';
import { Topic } from '@/types/posts';
import SearchBar from '@/components/search/SearchBar';
import Paginator from '@/components/pagination/Paginator';

interface TopicsDropdownProps {
  topics: Topic[];
  selectedTopic: string | null;
  onTopicChange: (topicId: string | null) => void;
}

export function TopicsDropdown({ topics, selectedTopic, onTopicChange }: Readonly<TopicsDropdownProps>) {
  const { t } = useTranslation('common');
  const [topicSearchQuery, setTopicSearchQuery] = useState('');
  const [filteredTopics, setFilteredTopics] = useState<Topic[]>(topics);
  const [currentPage, setCurrentPage] = useState(1);

  const itemsPerPage = 5;
  const totalPages = Math.ceil(filteredTopics.length / itemsPerPage);
  const paginatedTopics = filteredTopics.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const handleTopicSearch = (query: string) => {
    setTopicSearchQuery(query);
    const filtered = topics.filter(topic => topic.name.toLowerCase().includes(query.toLowerCase()));
    setFilteredTopics(filtered);
    setCurrentPage(1);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  return (
    <DropdownButton
      id="topics-dropdown"
      variant="primary"
      className="mb-2 topics-dropdown"
      flip={false}
      align="start"
      title={
        selectedTopic
          ? topics.find(topic => topic.id === selectedTopic)?.name ?? t('common.allTopics')
          : t('common.allTopics')
      }
    >
      {/* Search Bar */}
      <div className="p-2">
        <SearchBar query={topicSearchQuery} onChange={handleTopicSearch} className="w-100" />
      </div>

      {/* Paginated Topics */}
      <Dropdown.Divider />
      <Dropdown.Item onClick={() => onTopicChange(null)} className="d-flex align-items-center">
        <Badge bg="gray" className="badge-gray me-2">
          {t('common.allTopics')}
        </Badge>
        {!selectedTopic && <FontAwesomeIcon icon="circle-check" className="ms-auto" />}
      </Dropdown.Item>
      {paginatedTopics.map(topic => (
        <Dropdown.Item key={topic.id} onClick={() => onTopicChange(topic.id)} className="d-flex align-items-center">
          <Badge bg={topic.color} className={`badge-${topic.color} me-2`}>
            {topic.name}
          </Badge>
          {selectedTopic === topic.id && <FontAwesomeIcon icon="circle-check" className="ms-auto" />}
        </Dropdown.Item>
      ))}

      {/* Pagination */}
      <Dropdown.Divider />
      <div className="d-flex justify-content-center p-2">
        <Paginator
          currentPage={currentPage}
          totalPages={totalPages}
          maxPagesToShow={5}
          onPageChange={handlePageChange}
        />
      </div>
    </DropdownButton>
  );
}
