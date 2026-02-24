import React from 'react';
import dynamic from 'next/dynamic';
import { SortDropdown } from '@/components/common/SortDropdown';
import { TopicsDropdown } from '@/components/common/TopicsDropdown';
import { useAppDispatch, useAppSelector } from '@/config/store';
import {
  setSortOrder,
  setSelectedTopics,
  setCategoryFilter,
  setDateRange,
  setReadingTimeRange,
  setSourceFilter,
} from '@/reducers/postsQuery';
import ReadingTimeDropdown from '@/components/common/ReadingTimeDropdown';
import SourceDropdown from '@/components/common/SourceDropdown';
import CategoryDropdown from '@/components/common/CategoryDropdown';

interface PostFiltersProps {
  showSourceFilter: boolean;
  showCategoryFilter?: boolean;
}

const DateRangePicker = dynamic(() => import('@/components/common/DateRangePicker'), {
  ssr: false,
  loading: () => <div className="post-filters-date-loading mb-2" />,
});

export function PostFilters({ showSourceFilter, showCategoryFilter = true }: Readonly<PostFiltersProps>) {
  const dispatch = useAppDispatch();
  const {
    sortOrder,
    selectedTopics,
    categoryFilter,
    sourceFilter,
    readingTimeRange,
    topics: fetchedTopics,
  } = useAppSelector(state => state.postsQuery);

  return (
    <div className="post-filters-layout mb-3">
      <div className="post-filters-row d-flex flex-column flex-md-row align-items-stretch">
        {showCategoryFilter && (
          <CategoryDropdown value={categoryFilter} onChange={value => dispatch(setCategoryFilter(value))} />
        )}
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
      </div>
      <div className="post-filters-sort-slot d-flex align-items-stretch">
        <SortDropdown sortOrder={sortOrder} onChange={order => dispatch(setSortOrder(order))} />
      </div>
    </div>
  );
}
