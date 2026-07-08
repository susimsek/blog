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
  type DateRange,
  type ReadingTimeRange,
  type SortOrder,
  type CategoryFilter,
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
  onSortOrderChange?: (value: SortOrder) => void;
  onTopicsChange?: (value: string[]) => void;
  onCategoryFilterChange?: (value: CategoryFilter) => void;
  onDateRangeChange?: (value: DateRange) => void;
  onReadingTimeRangeChange?: (value: ReadingTimeRange) => void;
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
  onSortOrderChange,
  onTopicsChange,
  onCategoryFilterChange,
  onDateRangeChange,
  onReadingTimeRangeChange,
}: Readonly<PostFiltersProps>) {
  const dispatch = useAppDispatch();
  const { sortOrder, selectedTopics, categoryFilter, dateRange, readingTimeRange } = useAppSelector(
    state => state.postsQuery,
  );

  return (
    <div className="post-filters-layout mb-3">
      <div className="post-filters-main-grid">
        {showCategoryFilter && (
          <CategoryDropdown
            value={categoryFilter}
            onChange={value => {
              if (onCategoryFilterChange) {
                onCategoryFilterChange(value);
                return;
              }
              dispatch(setCategoryFilter(value));
            }}
          />
        )}
        {topics.length > 0 && (
          <TopicsDropdown
            topics={topics}
            selectedTopics={selectedTopics}
            onTopicsChange={topicIds => {
              if (onTopicsChange) {
                onTopicsChange(topicIds);
                return;
              }
              dispatch(setSelectedTopics(topicIds));
            }}
          />
        )}
        {showSourceFilter && <SourceDropdown value={sourceFilter} onChange={value => onSourceFilterChange?.(value)} />}
        <DateRangePicker
          value={dateRange}
          onRangeChange={dates => {
            if (onDateRangeChange) {
              onDateRangeChange(dates);
              return;
            }
            dispatch(setDateRange(dates));
          }}
          minDate={new Date('2024-01-01')}
          maxDate={new Date()}
        />
        <ReadingTimeDropdown
          value={readingTimeRange}
          onChange={value => {
            if (onReadingTimeRangeChange) {
              onReadingTimeRangeChange(value);
              return;
            }
            dispatch(setReadingTimeRange(value));
          }}
        />
      </div>
      {showSortFilter && (
        <div className="post-filters-sort-slot">
          <SortDropdown
            sortOrder={sortOrder}
            onChange={order => {
              if (onSortOrderChange) {
                onSortOrderChange(order);
                return;
              }
              dispatch(setSortOrder(order));
            }}
          />
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
