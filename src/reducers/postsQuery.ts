import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { PostSummary } from '@/types/posts';

export type SortOrder = 'asc' | 'desc';

export type DateRange = {
  startDate?: string;
  endDate?: string;
};

export interface PostsQueryState {
  query: string;
  sortOrder: SortOrder;
  page: number;
  pageSize: number;
  selectedTopics: string[];
  dateRange: DateRange;
  locale: string | null;
  posts: PostSummary[];
}

const initialState: PostsQueryState = {
  query: '',
  sortOrder: 'desc',
  page: 1,
  pageSize: 5,
  selectedTopics: [],
  dateRange: {},
  locale: null,
  posts: [],
};

const postsQuerySlice = createSlice({
  name: 'postsQuery',
  initialState,
  reducers: {
    setPosts: (state, action: PayloadAction<PostSummary[]>) => {
      state.posts = action.payload;
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
    setDateRange: (state, action: PayloadAction<DateRange>) => {
      state.dateRange = action.payload;
      state.page = 1;
    },
    setLocale: (state, action: PayloadAction<string | null>) => {
      state.locale = action.payload;
    },
    resetFilters: state => {
      state.query = '';
      state.selectedTopics = [];
      state.dateRange = {};
      state.page = 1;
      state.sortOrder = 'desc';
    },
  },
});

export const {
  setPosts,
  setQuery,
  setSortOrder,
  setPage,
  setPageSize,
  setSelectedTopics,
  setDateRange,
  setLocale,
  resetFilters,
} = postsQuerySlice.actions;

export default postsQuerySlice.reducer;
