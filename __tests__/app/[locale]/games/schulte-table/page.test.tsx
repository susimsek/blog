import React from 'react';
import { render, screen } from '@testing-library/react';
import SchulteTableRoute, { generateMetadata } from '@/app/(localized)/[locale]/games/schulte-table/page';

const getServerTranslatorMock = jest.fn(async () => ({
  t: (key: string) =>
    ({
      'games.schulte.meta.title': 'Schulte Meta Title',
      'games.schulte.meta.description': 'Schulte Meta Description',
      'games.schulte.meta.keywords': 'schulte,meta,keywords',
    })[key] ?? key,
}));
const loadLocaleResourcesMock = jest.fn(async () => ({ games: { games: { schulte: { title: 'Schulte' } } } }));
const getSortedPostsDataMock = jest.fn(async () => [{ id: 'post-1' }, { id: 'post-2' }]);
const getAllTopicsMock = jest.fn(async () => [{ id: 'topic-1' }]);
const getTopTopicsFromPostsMock = jest.fn(() => [{ id: 'topic-1' }]);
const getLayoutPostsMock = jest.fn(() => [{ id: 'post-1' }]);
const schultePageMock = jest.fn(() => <div data-testid="schulte-page">schulte-page</div>);

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

jest.mock('@/views/SchulteTablePage', () => ({
  __esModule: true,
  default: (props: unknown) => schultePageMock(props),
}));

describe('App Route /[locale]/games/schulte-table', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('builds schulte metadata from i18n translator', async () => {
    const metadata = await generateMetadata({
      params: Promise.resolve({ locale: 'en' }),
      searchParams: Promise.resolve({}),
    });

    expect(metadata).toMatchObject({
      title: 'Schulte Meta Title',
      description: 'Schulte Meta Description',
      keywords: 'schulte,meta,keywords',
    });
  });

  it('loads route data and renders SchulteTablePage', async () => {
    const element = await SchulteTableRoute({
      params: Promise.resolve({ locale: 'tr' }),
      searchParams: Promise.resolve({}),
    });
    render(element);

    expect(getSortedPostsDataMock).toHaveBeenCalledWith('tr');
    expect(getAllTopicsMock).toHaveBeenCalledWith('tr');
    expect(loadLocaleResourcesMock).toHaveBeenCalledWith('tr', ['games']);
    expect(schultePageMock).toHaveBeenCalledWith({
      layoutPosts: [{ id: 'post-1' }],
      topics: [{ id: 'topic-1' }],
      preFooterTopTopics: [{ id: 'topic-1' }],
    });
    expect(screen.getByTestId('schulte-page')).toBeInTheDocument();
  });
});
