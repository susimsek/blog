import React from 'react';
import { render, screen } from '@testing-library/react';
import ContactRoute, { generateMetadata } from '@/app/[locale]/contact/page';

const getServerTranslatorMock = jest.fn(async (_locale: string, _ns: string[]) => ({
  t: (key: string) =>
    ({
      'contact.meta.title': 'Contact Meta Title',
      'contact.meta.description': 'Contact Meta Description',
      'contact.meta.keywords': 'contact,meta,keywords',
    })[key] ?? key,
}));

const getSortedPostsDataMock = jest.fn(async (_locale: string) => [{ id: 'post-1' }, { id: 'post-2' }]);
const getAllTopicsMock = jest.fn(async (_locale: string) => [{ id: 'topic-1' }]);
const getTopTopicsFromPostsMock = jest.fn((_posts: unknown[], _topics: unknown[]) => [{ id: 'topic-1' }]);
const getLayoutPostsMock = jest.fn((_posts: unknown[]) => [{ id: 'post-1' }]);
const contactPageMock = jest.fn(
  (props: { layoutPosts: unknown[]; topics: unknown[]; preFooterTopTopics: unknown[] }) => (
    <div data-testid="contact-page">contact-page</div>
  ),
);

jest.mock('@/i18n/server', () => ({
  getServerTranslator: (locale: string, ns: string[]) => getServerTranslatorMock(locale, ns),
}));

jest.mock('@/lib/posts', () => ({
  getSortedPostsData: (locale: string) => getSortedPostsDataMock(locale),
  getAllTopics: (locale: string) => getAllTopicsMock(locale),
  getTopTopicsFromPosts: (posts: unknown[], topics: unknown[]) => getTopTopicsFromPostsMock(posts, topics),
  getLayoutPosts: (posts: unknown[]) => getLayoutPostsMock(posts),
}));

jest.mock('@/views/ContactPage', () => ({
  __esModule: true,
  default: (props: { layoutPosts: unknown[]; topics: unknown[]; preFooterTopTopics: unknown[] }) =>
    contactPageMock(props),
}));

describe('App Route /[locale]/contact', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('builds metadata from i18n translator', async () => {
    const metadata = await generateMetadata({
      params: Promise.resolve({ locale: 'en' }),
      searchParams: Promise.resolve({}),
    });

    expect(metadata).toMatchObject({
      title: 'Contact Meta Title',
      description: 'Contact Meta Description',
      keywords: 'contact,meta,keywords',
    });
  });

  it('loads page data and renders ContactPage view', async () => {
    const element = await ContactRoute({
      params: Promise.resolve({ locale: 'tr' }),
      searchParams: Promise.resolve({}),
    });
    render(element);

    expect(getSortedPostsDataMock).toHaveBeenCalledWith('tr');
    expect(getAllTopicsMock).toHaveBeenCalledWith('tr');
    expect(contactPageMock).toHaveBeenCalledWith({
      layoutPosts: [{ id: 'post-1' }],
      topics: [{ id: 'topic-1' }],
      preFooterTopTopics: [{ id: 'topic-1' }],
    });
    expect(screen.getByTestId('contact-page')).toBeInTheDocument();
  });
});
