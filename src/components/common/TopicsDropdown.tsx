import React, { useState, useMemo } from 'react';
import { Dropdown, DropdownButton, Badge, Alert } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { useTranslation } from 'next-i18next';
import { Topic } from '@/types/posts';
import SearchBar from '@/components/search/SearchBar';
import Paginator from '@/components/pagination/Paginator';

interface TopicsDropdownProps {
  topics: Topic[];
  selectedTopics: string[];
  onTopicsChange: (topicIds: string[]) => void;
}

export function TopicsDropdown({ topics, selectedTopics, onTopicsChange }: Readonly<TopicsDropdownProps>) {
  const { t } = useTranslation(['common', 'topic']);
  const [topicSearchQuery, setTopicSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  const itemsPerPage = 5;

  const filteredTopics = useMemo(() => {
    return topics.filter(topic => topic.name.toLowerCase().includes(topicSearchQuery.toLowerCase().trim()));
  }, [topics, topicSearchQuery]);

  const paginatedTopics = useMemo(() => {
    return filteredTopics.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);
  }, [filteredTopics, currentPage, itemsPerPage]);

  const handleTopicSearch = (query: string) => {
    setTopicSearchQuery(query);
    setCurrentPage(1);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleTopicToggle = (topicId: string) => {
    const newSelectedTopics = selectedTopics.includes(topicId)
      ? selectedTopics.filter(id => id !== topicId)
      : [...selectedTopics, topicId];

    onTopicsChange(newSelectedTopics);
  };

  const handleTopicRemove = (topicId: string) => {
    onTopicsChange(selectedTopics.filter(id => id !== topicId));
  };

  const getDropdownTitle = () => {
    if (selectedTopics.length === 0) {
      return t('topic:topic.allTopics');
    }

    if (selectedTopics.length > 3) {
      const firstThreeNames = selectedTopics
        .slice(0, 3)
        .map(id => topics.find(topic => topic.id === id)?.name)
        .join(', ');
      return `${firstThreeNames} ${t('common.andMore', { count: selectedTopics.length - 3 })}`;
    }

    return selectedTopics.map(id => topics.find(topic => topic.id === id)?.name).join(', ');
  };

  return (
    <DropdownButton
      id="topics-dropdown"
      variant="primary"
      className="mb-2 topics-dropdown"
      flip={false}
      align="start"
      title={getDropdownTitle()}
    >
      <div className="p-2">
        <SearchBar query={topicSearchQuery} onChange={handleTopicSearch} className="w-100" />
      </div>

      <Dropdown.Divider />

      {selectedTopics.length > 0 && (
        <>
          <Dropdown.Header>{t('topic:topic.selectedTopics')}</Dropdown.Header>
          <div className="p-3">
            {selectedTopics.map(topicId => {
              const topic = topics.find(t => t.id === topicId);
              if (!topic) return null;
              return (
                <Badge key={topicId} bg={topic.color} className={`badge-${topic.color} me-2 mb-2`}>
                  {topic.name}{' '}
                  <FontAwesomeIcon
                    icon="times"
                    className="ms-1 cursor-pointer"
                    onClick={() => handleTopicRemove(topicId)}
                  />
                </Badge>
              );
            })}
          </div>
          <Dropdown.Divider />
        </>
      )}

      <Dropdown.Item onClick={() => onTopicsChange([])} className="d-flex align-items-center">
        <Badge bg="gray" className="badge-gray me-2">
          {t('topic:topic.allTopics')}
        </Badge>
        {selectedTopics.length === 0 && <FontAwesomeIcon icon="circle-check" className="ms-auto" />}
      </Dropdown.Item>

      {paginatedTopics.length > 0 ? (
        paginatedTopics.map(topic => (
          <Dropdown.Item
            key={topic.id}
            onClick={() => handleTopicToggle(topic.id)}
            className="d-flex align-items-center"
          >
            <Badge bg={topic.color} className={`badge-${topic.color} me-2`}>
              {topic.name}
            </Badge>
            {selectedTopics.includes(topic.id) && <FontAwesomeIcon icon="circle-check" className="ms-auto" />}
          </Dropdown.Item>
        ))
      ) : (
        <Dropdown.Item className="text-center py-3">
          <Alert variant="info" className="mb-0 d-flex align-items-center">
            <FontAwesomeIcon icon="exclamation-circle" className="me-2" size="lg" />
            {t('topic:topic.noTopicFound')}
          </Alert>
        </Dropdown.Item>
      )}

      {filteredTopics.length > 0 && (
        <>
          <Dropdown.Divider />
          <div className="d-flex justify-content-center p-2">
            <Paginator
              currentPage={currentPage}
              totalPages={Math.ceil(filteredTopics.length / itemsPerPage)}
              maxPagesToShow={5}
              onPageChange={handlePageChange}
            />
          </div>
        </>
      )}
    </DropdownButton>
  );
}
