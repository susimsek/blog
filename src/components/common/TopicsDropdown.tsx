import React, { useState, useMemo, useCallback } from 'react';
import { Dropdown, DropdownButton, Badge, Alert, Button } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { useTranslation } from 'next-i18next';
import { Topic } from '@/types/posts';
import SearchBar from '@/components/search/SearchBar';
import Paginator from '@/components/pagination/Paginator';
import useDebounce from '@/hooks/useDebounce';

interface TopicsDropdownProps {
  topics: Topic[];
  selectedTopics: string[];
  onTopicsChange: (topicIds: string[]) => void;
}

export function TopicsDropdown({ topics, selectedTopics, onTopicsChange }: Readonly<TopicsDropdownProps>) {
  const { t } = useTranslation(['common', 'topic']);
  const [topicSearchQuery, setTopicSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [showDropdown, setShowDropdown] = useState(false);
  const [pendingSelectedTopics, setPendingSelectedTopics] = useState<string[]>(selectedTopics);

  const itemsPerPage = 10;

  // Debounced search query
  const debouncedTopicSearchQuery = useDebounce(topicSearchQuery, 500); // 500ms debounce

  // Filtered topics based on the debounced query
  const filteredTopics = useMemo(() => {
    return topics.filter(topic => topic.name.toLowerCase().includes(debouncedTopicSearchQuery.toLowerCase().trim()));
  }, [topics, debouncedTopicSearchQuery]);

  // Paginated topics
  const paginatedTopics = useMemo(() => {
    return filteredTopics.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);
  }, [filteredTopics, currentPage, itemsPerPage]);

  // Dropdown title
  const dropdownTitle = useMemo(() => {
    if (selectedTopics.length === 0) {
      return t('topic:topic.allTopics');
    }

    if (selectedTopics.length > 3) {
      const firstThreeNames = selectedTopics
        .slice(0, 3)
        .map(id => topics.find(topic => topic.id === id)?.name)
        .filter(Boolean)
        .join(', ');
      return `${firstThreeNames} ${t('common.andMore', { count: selectedTopics.length - 3 })}`;
    }

    return selectedTopics
      .map(id => topics.find(topic => topic.id === id)?.name)
      .filter(Boolean)
      .join(', ');
  }, [selectedTopics, topics, t]);

  // Callback functions
  const handleTopicSearch = useCallback((query: string) => {
    setTopicSearchQuery(query);
    setCurrentPage(1);
  }, []);

  const handlePageChange = useCallback((page: number) => {
    setCurrentPage(page);
  }, []);

  const handleTopicToggle = useCallback(
    (topicId: string) => {
      if (!pendingSelectedTopics.includes(topicId)) {
        setPendingSelectedTopics([...pendingSelectedTopics, topicId]);
      }
    },
    [pendingSelectedTopics],
  );

  const handleToggle = (isOpen: boolean) => {
    setShowDropdown(isOpen);
    if (!isOpen) {
      setPendingSelectedTopics(selectedTopics);
    }
  };

  const handleTopicClear = useCallback(() => {
    setPendingSelectedTopics([]);
    setShowDropdown(false);
    onTopicsChange([]);
  }, [setPendingSelectedTopics, setShowDropdown, onTopicsChange]);

  const handleTopicRemove = useCallback(
    (topicId: string) => {
      setPendingSelectedTopics(pendingSelectedTopics.filter(id => id !== topicId));
    },
    [pendingSelectedTopics],
  );

  const handleApplySelection = useCallback(() => {
    onTopicsChange(pendingSelectedTopics);
    setShowDropdown(false);
  }, [pendingSelectedTopics, onTopicsChange]);

  return (
    <DropdownButton
      id="topics-dropdown"
      variant="gray"
      className="mb-2 topics-dropdown"
      flip={false}
      align="start"
      title={
        <span>
          <FontAwesomeIcon icon="tags" className="me-2" />
          {dropdownTitle}
        </span>
      }
      show={showDropdown}
      onToggle={handleToggle}
      autoClose="outside"
    >
      <div className="p-2">
        <SearchBar query={topicSearchQuery} onChange={handleTopicSearch} className="w-100" />
      </div>

      <Dropdown.Divider />

      {pendingSelectedTopics.length > 0 && (
        <>
          <Dropdown.Header>
            <div className="d-flex justify-content-between align-items-center">
              <span>{t('topic:topic.selectedTopics')}</span>

              <Button variant="danger" onClick={handleTopicClear} className="btn-badge">
                <FontAwesomeIcon icon="trash" className="me-2" />
                {t('common.clearAll')}
              </Button>
            </div>
          </Dropdown.Header>
          <div className="p-2 ms-2">
            {pendingSelectedTopics.map(topicId => {
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

      <Dropdown.Item className="d-flex align-items-center" onClick={handleTopicClear}>
        <Badge bg="gray" className="badge-gray me-2">
          {t('topic:topic.allTopics')}
        </Badge>
        {pendingSelectedTopics.length === 0 && <FontAwesomeIcon icon="circle-check" className="ms-auto" />}
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
            {pendingSelectedTopics.includes(topic.id) && <FontAwesomeIcon icon="circle-check" className="ms-auto" />}
          </Dropdown.Item>
        ))
      ) : (
        <Dropdown.Item className="text-center py-3">
          <Alert variant="warning" className="mb-0 d-flex align-items-center">
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

      <Dropdown.Divider />
      <div className="d-flex justify-content-center p-2">
        <Button
          className="apply-button"
          variant="success"
          disabled={selectedTopics.length === 0 && pendingSelectedTopics.length === 0}
          onClick={handleApplySelection}
        >
          <FontAwesomeIcon icon="check" className="me-2" />
          {t('common.datePicker.applySelection')}
        </Button>
      </div>
    </DropdownButton>
  );
}
