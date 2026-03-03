import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export type SortOrder = 'asc' | 'desc';

export type DateRange = {
  startDate?: string;
  endDate?: string;
};

export type ReadingTimeRange = 'any' | '3-7' | '8-12' | '15+';
export type SourceFilter = 'all' | 'blog' | 'medium';
export type CategoryFilter = 'all' | (string & {});

export interface PostsQueryState {
  sortOrder: SortOrder;
  selectedTopics: string[];
  categoryFilter: CategoryFilter;
  dateRange: DateRange;
  readingTimeRange: ReadingTimeRange;
  locale: string | null;
}

const initialState: PostsQueryState = {
  sortOrder: 'desc',
  selectedTopics: [],
  categoryFilter: 'all',
  dateRange: {},
  readingTimeRange: 'any',
  locale: null,
};

const postsQuerySlice = createSlice({
  name: 'postsQuery',
  initialState,
  reducers: {
    setSortOrder: (state, action: PayloadAction<SortOrder>) => {
      state.sortOrder = action.payload;
    },
    setSelectedTopics: (state, action: PayloadAction<string[]>) => {
      state.selectedTopics = action.payload;
    },
    setCategoryFilter: (state, action: PayloadAction<CategoryFilter>) => {
      state.categoryFilter = action.payload;
    },
    setDateRange: (state, action: PayloadAction<DateRange>) => {
      state.dateRange = action.payload;
    },
    setReadingTimeRange: (state, action: PayloadAction<ReadingTimeRange>) => {
      state.readingTimeRange = action.payload;
    },
    setLocale: (state, action: PayloadAction<string | null>) => {
      state.locale = action.payload;
    },
    clearNonSearchFilters: state => {
      state.selectedTopics = [];
      state.categoryFilter = 'all';
      state.dateRange = {};
      state.readingTimeRange = 'any';
    },
    resetFilters: state => {
      state.selectedTopics = [];
      state.categoryFilter = 'all';
      state.dateRange = {};
      state.readingTimeRange = 'any';
      state.sortOrder = 'desc';
    },
  },
});

export const {
  setSortOrder,
  setSelectedTopics,
  setCategoryFilter,
  setDateRange,
  setReadingTimeRange,
  setLocale,
  clearNonSearchFilters,
  resetFilters,
} = postsQuerySlice.actions;

export default postsQuerySlice.reducer;
