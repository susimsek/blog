import React from 'react';
import { render, screen } from '@testing-library/react';
import StroopTestRoute, { generateMetadata } from '@/app/(localized)/[locale]/games/stroop-test/page';

const getServerTranslatorMock = jest.fn(async (_locale: string, _ns: string[]) => ({
  t: (key: string) =>
    ({
      'games.stroop.meta.title': 'Stroop Meta Title',
      'games.stroop.meta.description': 'Stroop Meta Description',
      'games.stroop.meta.keywords': 'stroop,meta,keywords',
    })[key] ?? key,
}));
const loadLocaleResourcesMock = jest.fn(async (_locale: string, _ns: string[]) => ({
  games: { games: { stroop: { title: 'Stroop' } } },
}));
const getSortedPostsDataMock = jest.fn(async (_locale: string) => [{ id: 'post-1' }, { id: 'post-2' }]);
const getAllTopicsMock = jest.fn(async (_locale: string) => [{ id: 'topic-1' }]);
const getTopTopicsFromPostsMock = jest.fn((_posts: unknown[], _topics: unknown[]) => [{ id: 'topic-1' }]);
const getLayoutPostsMock = jest.fn((_posts: unknown[]) => [{ id: 'post-1' }]);
const stroopPageMock = jest.fn((_props: unknown) => <div data-testid="stroop-page">stroop-page</div>);

jest.mock('@/i18n/server', () => ({
  getServerTranslator: (locale: string, ns: string[]) => getServerTranslatorMock(locale, ns),
  loadLocaleResources: (locale: string, ns: string[]) => loadLocaleResourcesMock(locale, ns),
}));

jest.mock('@/i18n/RouteI18nProvider', () => ({
  __esModule: true,
  default: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

jest.mock('@/lib/posts', () => ({
  getSortedPostsData: (locale: string) => getSortedPostsDataMock(locale),
  getAllTopics: (locale: string) => getAllTopicsMock(locale),
  getTopTopicsFromPosts: (posts: unknown[], topics: unknown[]) => getTopTopicsFromPostsMock(posts, topics),
  getLayoutPosts: (posts: unknown[]) => getLayoutPostsMock(posts),
}));

jest.mock('@/views/StroopTestPage', () => ({
  __esModule: true,
  default: (props: unknown) => stroopPageMock(props),
}));

describe('App Route /[locale]/games/stroop-test', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('builds stroop metadata from i18n translator', async () => {
    const metadata = await generateMetadata({
      params: Promise.resolve({ locale: 'en' }),
    });

    expect(metadata).toMatchObject({
      title: 'Stroop Meta Title',
      description: 'Stroop Meta Description',
      keywords: 'stroop,meta,keywords',
    });
  });

  it('loads route data and renders StroopTestPage', async () => {
    const element = await StroopTestRoute({
      params: Promise.resolve({ locale: 'tr' }),
    });
    render(element);

    expect(getSortedPostsDataMock).toHaveBeenCalledWith('tr');
    expect(getAllTopicsMock).toHaveBeenCalledWith('tr');
    expect(loadLocaleResourcesMock).toHaveBeenCalledWith('tr', ['games']);
    expect(stroopPageMock).toHaveBeenCalledWith({
      layoutPosts: [{ id: 'post-1' }],
      topics: [{ id: 'topic-1' }],
      preFooterTopTopics: [{ id: 'topic-1' }],
    });
    expect(screen.getByTestId('stroop-page')).toBeInTheDocument();
  });
});
