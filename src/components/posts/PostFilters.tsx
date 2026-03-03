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
  type SourceFilter,
} from '@/reducers/postsQuery';
import ReadingTimeDropdown from '@/components/common/ReadingTimeDropdown';
import SourceDropdown from '@/components/common/SourceDropdown';
import CategoryDropdown from '@/components/common/CategoryDropdown';
import PostDensityToggle, { type PostDensityMode } from '@/components/common/PostDensityToggle';
import type { Topic } from '@/types/posts';

interface PostFiltersProps {
  topics?: Topic[];
  sourceFilter?: SourceFilter;
  showSourceFilter: boolean;
  showCategoryFilter?: boolean;
  showSortFilter?: boolean;
  densityMode?: PostDensityMode;
  onDensityModeChange?: (mode: PostDensityMode) => void;
  onSourceFilterChange?: (value: SourceFilter) => void;
}

const DateRangePicker = dynamic(() => import('@/components/common/DateRangePicker'), {
  ssr: false,
  loading: () => <div className="post-filters-date-loading mb-2" />,
});

export function PostFilters({
  topics = [],
  sourceFilter = 'all',
  showSourceFilter,
  showCategoryFilter = true,
  showSortFilter = true,
  densityMode = 'default',
  onDensityModeChange,
  onSourceFilterChange,
}: Readonly<PostFiltersProps>) {
  const dispatch = useAppDispatch();
  const { sortOrder, selectedTopics, categoryFilter, readingTimeRange } = useAppSelector(state => state.postsQuery);

  return (
    <div className="post-filters-layout mb-3">
      <div className="post-filters-main-grid">
        {showCategoryFilter && (
          <CategoryDropdown value={categoryFilter} onChange={value => dispatch(setCategoryFilter(value))} />
        )}
        {topics.length > 0 && (
          <TopicsDropdown
            topics={topics}
            selectedTopics={selectedTopics}
            onTopicsChange={topicIds => dispatch(setSelectedTopics(topicIds))}
          />
        )}
        {showSourceFilter && <SourceDropdown value={sourceFilter} onChange={value => onSourceFilterChange?.(value)} />}
        <DateRangePicker
          onRangeChange={dates => dispatch(setDateRange(dates))}
          minDate={new Date('2024-01-01')}
          maxDate={new Date()}
        />
        <ReadingTimeDropdown value={readingTimeRange} onChange={value => dispatch(setReadingTimeRange(value))} />
      </div>
      {showSortFilter && (
        <div className="post-filters-sort-slot">
          <SortDropdown sortOrder={sortOrder} onChange={order => dispatch(setSortOrder(order))} />
        </div>
      )}
      {onDensityModeChange && (
        <div className="post-filters-density-slot">
          <PostDensityToggle value={densityMode} onChange={onDensityModeChange} />
        </div>
      )}
    </div>
  );
}
