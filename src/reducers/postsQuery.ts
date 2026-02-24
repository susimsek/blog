import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { PostSummary, Topic } from '@/types/posts';

export type SortOrder = 'asc' | 'desc';

export type DateRange = {
  startDate?: string;
  endDate?: string;
};

export type ReadingTimeRange = 'any' | '3-7' | '8-12' | '15+';
export type SourceFilter = 'all' | 'blog' | 'medium';
export type CategoryFilter = 'all' | string;

export interface PostsQueryState {
  query: string;
  sortOrder: SortOrder;
  page: number;
  pageSize: number;
  selectedTopics: string[];
  categoryFilter: CategoryFilter;
  sourceFilter: SourceFilter;
  dateRange: DateRange;
  readingTimeRange: ReadingTimeRange;
  locale: string | null;
  posts: PostSummary[];
  topics: Topic[];
  topicsLoading: boolean;
}

const initialState: PostsQueryState = {
  query: '',
  sortOrder: 'desc',
  page: 1,
  pageSize: 5,
  selectedTopics: [],
  categoryFilter: 'all',
  sourceFilter: 'all',
  dateRange: {},
  readingTimeRange: 'any',
  locale: null,
  posts: [],
  topics: [],
  topicsLoading: false,
};

const postsQuerySlice = createSlice({
  name: 'postsQuery',
  initialState,
  reducers: {
    setPosts: (state, action: PayloadAction<PostSummary[]>) => {
      state.posts = action.payload;
    },
    setTopics: (state, action: PayloadAction<Topic[]>) => {
      state.topics = action.payload;
    },
    setTopicsLoading: (state, action: PayloadAction<boolean>) => {
      state.topicsLoading = action.payload;
    },
    setQuery: (state, action: PayloadAction<string>) => {
      state.query = action.payload;
      state.page = 1;
    },
    setSortOrder: (state, action: PayloadAction<SortOrder>) => {
      state.sortOrder = action.payload;
      state.page = 1;
    },
    setPage: (state, action: PayloadAction<number>) => {
      state.page = action.payload;
    },
    setPageSize: (state, action: PayloadAction<number>) => {
      state.pageSize = action.payload;
      state.page = 1;
    },
    setSelectedTopics: (state, action: PayloadAction<string[]>) => {
      state.selectedTopics = action.payload;
      state.page = 1;
    },
    setCategoryFilter: (state, action: PayloadAction<CategoryFilter>) => {
      state.categoryFilter = action.payload;
      state.page = 1;
    },
    setSourceFilter: (state, action: PayloadAction<SourceFilter>) => {
      state.sourceFilter = action.payload;
      state.page = 1;
    },
    setDateRange: (state, action: PayloadAction<DateRange>) => {
      state.dateRange = action.payload;
      state.page = 1;
    },
    setReadingTimeRange: (state, action: PayloadAction<ReadingTimeRange>) => {
      state.readingTimeRange = action.payload;
      state.page = 1;
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
      state.query = '';
      state.selectedTopics = [];
      state.categoryFilter = 'all';
      state.sourceFilter = 'all';
      state.dateRange = {};
      state.readingTimeRange = 'any';
      state.page = 1;
      state.sortOrder = 'desc';
    },
  },
});

export const {
  setPosts,
  setTopics,
  setTopicsLoading,
  setQuery,
  setSortOrder,
  setPage,
  setPageSize,
  setSelectedTopics,
  setCategoryFilter,
  setSourceFilter,
  setDateRange,
  setReadingTimeRange,
  setLocale,
  clearNonSearchFilters,
  resetFilters,
} = postsQuerySlice.actions;

export default postsQuerySlice.reducer;
