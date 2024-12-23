import React from 'react';
import { SortDropdown } from '@/components/common/SortDropdown';
import { TopicsDropdown } from '@/components/common/TopicsDropdown';
import DateRangePicker from '@/components/common/DateRangePicker';
import SearchBar from '@/components/search/SearchBar';
import { Topic } from '@/types/posts';

interface PostFiltersProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  sortOrder: 'asc' | 'desc';
  onSortChange: (sortOrder: 'asc' | 'desc') => void;
  selectedTopics: string[];
  onTopicsChange: (topics: string[]) => void;
  onDateRangeChange: (dates: { startDate?: string; endDate?: string }) => void;
  topics?: Topic[];
}

export function PostFilters({
  searchQuery,
  onSearchChange,
  sortOrder,
  onSortChange,
  selectedTopics,
  onTopicsChange,
  onDateRangeChange,
  topics = [],
}: PostFiltersProps) {
  return (
    <div className="d-flex flex-wrap align-items-center mb-3">
      <div className="flex-grow-1 mb-4">
        <SearchBar query={searchQuery} onChange={onSearchChange} />
      </div>
      <div className="d-flex flex-column flex-md-row align-items-stretch w-100 w-md-auto" style={{ gap: '10px' }}>
        {topics.length > 0 && (
          <TopicsDropdown topics={topics} selectedTopics={selectedTopics} onTopicsChange={onTopicsChange} />
        )}
        <DateRangePicker onRangeChange={onDateRangeChange} minDate={new Date('2024-01-01')} maxDate={new Date()} />
        <SortDropdown sortOrder={sortOrder} onChange={onSortChange} />
      </div>
    </div>
  );
}
