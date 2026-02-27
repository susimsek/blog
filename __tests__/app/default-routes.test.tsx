import React from 'react';
import { render, screen } from '@testing-library/react';
import AboutRedirectPage from '@/app/(default)/about/page';
import ContactRedirectPage from '@/app/(default)/contact/page';
import MediumRedirectPage from '@/app/(default)/medium/page';
import SearchRedirectPage from '@/app/(default)/search/page';
import StroopTestRedirectPage from '@/app/(default)/games/stroop-test/page';
import SchulteTableRedirectPage from '@/app/(default)/games/schulte-table/page';
import CategoryRedirectPage, {
  generateStaticParams as generateCategoryParams,
} from '@/app/(default)/categories/[id]/page';
import PostRedirectPage, { generateStaticParams as generatePostParams } from '@/app/(default)/posts/[id]/page';
import TopicRedirectPage, { generateStaticParams as generateTopicParams } from '@/app/(default)/topics/[id]/page';
import GlobalNotFound from '@/app/(default)/not-found';

const localeRedirectMock = jest.fn(({ path }: { path: string }) => <div data-testid="redirect">{path}</div>);
const getAllCategoryIdsMock = jest.fn(async () => [
  { params: { locale: 'en', id: 'frontend' } },
  { params: { locale: 'tr', id: 'frontend' } },
]);
const getAllPostIdsMock = jest.fn(async () => [
  { params: { locale: 'en', id: 'welcome' } },
  { params: { locale: 'tr', id: 'welcome' } },
]);
const getAllTopicIdsMock = jest.fn(async () => [
  { params: { locale: 'en', id: 'react' } },
  { params: { locale: 'tr', id: 'react' } },
]);

jest.mock('@/components/LocaleRedirect', () => ({
  __esModule: true,
  default: (props: { path: string }) => localeRedirectMock(props),
}));

jest.mock('@/lib/posts', () => ({
  getAllCategoryIds: () => getAllCategoryIdsMock(),
  getAllPostIds: () => getAllPostIdsMock(),
  getAllTopicIds: () => getAllTopicIdsMock(),
}));

describe('Default routes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders locale redirects for default static pages', () => {
    render(
      <>
        <AboutRedirectPage />
        <ContactRedirectPage />
        <MediumRedirectPage />
        <SearchRedirectPage />
        <StroopTestRedirectPage />
        <SchulteTableRedirectPage />
      </>,
    );

    expect(screen.getByText('/about')).toBeInTheDocument();
    expect(screen.getByText('/contact')).toBeInTheDocument();
    expect(screen.getByText('/medium')).toBeInTheDocument();
    expect(screen.getByText('/search')).toBeInTheDocument();
    expect(screen.getByText('/games/stroop-test')).toBeInTheDocument();
    expect(screen.getByText('/games/schulte-table')).toBeInTheDocument();
  });

  it('generates static params and renders dynamic default redirects', async () => {
    await expect(generateCategoryParams()).resolves.toEqual([{ id: 'frontend' }]);
    await expect(generatePostParams()).resolves.toEqual([{ id: 'welcome' }]);
    await expect(generateTopicParams()).resolves.toEqual([{ id: 'react' }]);

    render(
      await CategoryRedirectPage({ params: Promise.resolve({ id: 'frontend' }), searchParams: Promise.resolve({}) }),
    );
    render(await PostRedirectPage({ params: Promise.resolve({ id: 'welcome' }), searchParams: Promise.resolve({}) }));
    render(await TopicRedirectPage({ params: Promise.resolve({ id: 'react' }), searchParams: Promise.resolve({}) }));

    expect(screen.getByText('/categories/frontend')).toBeInTheDocument();
    expect(screen.getByText('/posts/welcome')).toBeInTheDocument();
    expect(screen.getByText('/topics/react')).toBeInTheDocument();
  });

  it('renders the default not-found page', () => {
    render(<GlobalNotFound />);

    expect(screen.getByText('404')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Go to home' })).toBeInTheDocument();
  });
});
