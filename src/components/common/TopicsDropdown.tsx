import React, { useState } from 'react';
import { Dropdown, DropdownButton, FormControl, Pagination } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { useTranslation } from 'next-i18next';
import { Topic } from '@/types/posts';

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

  const handlePaginationClick = (page: number) => {
    setCurrentPage(page);
  };

  return (
    <DropdownButton
      id="topics-dropdown"
      variant="primary"
      className="mb-2"
      flip={false}
      align="start"
      title={
        selectedTopic
          ? topics.find(topic => topic.id === selectedTopic)?.name ?? t('common.allTopics')
          : t('common.allTopics')
      }
    >
      <div className="px-3 py-2 d-flex align-items-center">
        <FormControl
          type="text"
          placeholder={t('common.searchBar.placeholder')}
          value={topicSearchQuery}
          onChange={e => handleTopicSearch(e.target.value)}
          className="ms-auto w-75"
        />
        <FontAwesomeIcon icon="search" className="ms-2 text-muted" />
      </div>

      {/* Paginated Topics */}
      <Dropdown.Divider />
      <Dropdown.Item onClick={() => onTopicChange(null)}>
        {t('common.allTopics')}
        {!selectedTopic && <FontAwesomeIcon icon="circle-check" className="ms-2 circle-check" />}
      </Dropdown.Item>
      {paginatedTopics.map(topic => (
        <Dropdown.Item key={topic.id} onClick={() => onTopicChange(topic.id)}>
          {topic.name}
          {selectedTopic === topic.id && <FontAwesomeIcon icon="circle-check" className="ms-2 circle-check" />}
        </Dropdown.Item>
      ))}

      {/* Pagination */}
      <Dropdown.Divider />
      <div className="d-flex justify-content-center">
        <Pagination>
          {[...Array(totalPages)].map((_, index) => (
            <Pagination.Item
              key={index + 1}
              active={currentPage === index + 1}
              onClick={() => handlePaginationClick(index + 1)}
            >
              {index + 1}
            </Pagination.Item>
          ))}
        </Pagination>
      </div>
    </DropdownButton>
  );
}
