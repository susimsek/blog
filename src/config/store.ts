// config/store.ts
import { combineReducers, configureStore } from '@reduxjs/toolkit';
import themeReducer from '@/reducers/theme';
import postsQueryReducer from '@/reducers/postsQuery';
import voiceReducer from '@/reducers/voice';
import { useDispatch, useSelector } from 'react-redux';

const rootReducer = combineReducers({
  theme: themeReducer,
  voice: voiceReducer,
  postsQuery: postsQueryReducer,
});

export type RootState = ReturnType<typeof rootReducer>;

export const makeStore = (preloadedState?: Partial<RootState>) =>
  configureStore({
    reducer: rootReducer,
    preloadedState,
  });

export type AppStore = ReturnType<typeof makeStore>;
export type AppDispatch = AppStore['dispatch'];

export const useAppDispatch = useDispatch.withTypes<AppDispatch>();
export const useAppSelector = useSelector.withTypes<RootState>();

export { rootReducer };
