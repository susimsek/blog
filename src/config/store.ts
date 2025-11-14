// config/store.ts
import { configureStore } from '@reduxjs/toolkit';
import themeReducer from '@/reducers/theme';
import postsQueryReducer from '@/reducers/postsQuery';
import { TypedUseSelectorHook, useDispatch, useSelector } from 'react-redux';

const store = configureStore({
  reducer: {
    theme: themeReducer,
    postsQuery: postsQueryReducer,
  },
});

export type IRootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

export const useAppDispatch = () => useDispatch<AppDispatch>();
export const useAppSelector: TypedUseSelectorHook<IRootState> = useSelector;

export default store;
