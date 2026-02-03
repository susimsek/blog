import React from 'react';
import { SortDropdown } from '@/components/common/SortDropdown';
import { TopicsDropdown } from '@/components/common/TopicsDropdown';
import DateRangePicker from '@/components/common/DateRangePicker';
import SearchBar from '@/components/search/SearchBar';
import { Topic } from '@/types/posts';
import { useAppDispatch, useAppSelector } from '@/config/store';
import { setQuery, setSortOrder, setSelectedTopics, setDateRange, setReadingTimeRange } from '@/reducers/postsQuery';
import ReadingTimeDropdown from '@/components/common/ReadingTimeDropdown';

export interface PostFiltersProps {
  topics?: Topic[];
  searchEnabled?: boolean;
}

export function PostFilters({ topics = [], searchEnabled = true }: Readonly<PostFiltersProps>) {
  const dispatch = useAppDispatch();
  const { query, sortOrder, selectedTopics, readingTimeRange } = useAppSelector(state => state.postsQuery);

  return (
    <div className="d-flex flex-wrap align-items-center mb-3">
      {searchEnabled && (
        <div className="flex-grow-1 mb-4">
          <SearchBar query={query} onChange={value => dispatch(setQuery(value))} />
        </div>
      )}
      <div className="d-flex flex-column flex-md-row align-items-stretch w-100 w-md-auto" style={{ gap: '10px' }}>
        {topics.length > 0 && (
          <TopicsDropdown
            topics={topics}
            selectedTopics={selectedTopics}
            onTopicsChange={topicIds => dispatch(setSelectedTopics(topicIds))}
          />
        )}
        <DateRangePicker
          onRangeChange={dates => dispatch(setDateRange(dates))}
          minDate={new Date('2024-01-01')}
          maxDate={new Date()}
        />
        <ReadingTimeDropdown value={readingTimeRange} onChange={value => dispatch(setReadingTimeRange(value))} />
        <SortDropdown sortOrder={sortOrder} onChange={order => dispatch(setSortOrder(order))} />
      </div>
    </div>
  );
}
