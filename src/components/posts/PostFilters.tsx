import React from 'react';
import dynamic from 'next/dynamic';
import { SortDropdown } from '@/components/common/SortDropdown';
import { TopicsDropdown } from '@/components/common/TopicsDropdown';
import { useAppDispatch, useAppSelector } from '@/config/store';
import {
  setSortOrder,
  setSelectedTopics,
  setDateRange,
  setReadingTimeRange,
  setSourceFilter,
} from '@/reducers/postsQuery';
import ReadingTimeDropdown from '@/components/common/ReadingTimeDropdown';
import SourceDropdown from '@/components/common/SourceDropdown';

interface PostFiltersProps {
  showSourceFilter: boolean;
}

const DateRangePicker = dynamic(() => import('@/components/common/DateRangePicker'), {
  ssr: false,
  loading: () => <div className="mb-2" style={{ minWidth: '220px' }} />,
});

export function PostFilters({ showSourceFilter }: Readonly<PostFiltersProps>) {
  const dispatch = useAppDispatch();
  const {
    sortOrder,
    selectedTopics,
    sourceFilter,
    readingTimeRange,
    topics: fetchedTopics,
  } = useAppSelector(state => state.postsQuery);

  return (
    <div className="d-flex flex-wrap align-items-center mb-3">
      <div className="post-filters-row d-flex flex-column flex-md-row align-items-stretch w-100 w-md-auto">
        {fetchedTopics.length > 0 && (
          <TopicsDropdown
            topics={fetchedTopics}
            selectedTopics={selectedTopics}
            onTopicsChange={topicIds => dispatch(setSelectedTopics(topicIds))}
          />
        )}
        {showSourceFilter && (
          <SourceDropdown value={sourceFilter} onChange={value => dispatch(setSourceFilter(value))} />
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
