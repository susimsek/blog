import React from 'react';
import { render, screen } from '@testing-library/react';
import Localized404Page, { metadata } from '@/app/[locale]/404/page';
import LocaleNotFound from '@/app/[locale]/not-found';

const localeNotFoundPageMock = jest.fn(({ locale }: { locale: string }) => (
  <div data-testid="locale-not-found-page">{locale}</div>
));

const useParamsMock = jest.fn<{ locale?: string }, []>(() => ({ locale: 'tr' }));

jest.mock('next/navigation', () => ({
  useParams: () => useParamsMock(),
}));

jest.mock('@/views/LocaleNotFoundPage', () => ({
  __esModule: true,
  default: (props: { locale: string }) => localeNotFoundPageMock(props),
}));

describe('App Route /[locale]/404 and not-found boundary', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('exports noindex metadata for localized 404 page', () => {
    expect(metadata).toMatchObject({
      robots: {
        index: false,
        follow: false,
      },
    });
  });

  it('renders localized 404 page with locale param', async () => {
    const element = await Localized404Page({
      params: Promise.resolve({ locale: 'en' }),
      searchParams: Promise.resolve({}),
    });
    render(element);

    expect(localeNotFoundPageMock).toHaveBeenCalledWith({ locale: 'en' });
    expect(screen.getByTestId('locale-not-found-page')).toHaveTextContent('en');
  });

  it('renders not-found boundary using useParams locale', () => {
    render(<LocaleNotFound />);

    expect(localeNotFoundPageMock).toHaveBeenCalledWith({ locale: 'tr' });
    expect(screen.getByTestId('locale-not-found-page')).toHaveTextContent('tr');
  });

  it('falls back to default locale when useParams has no locale', () => {
    useParamsMock.mockReturnValueOnce({ locale: undefined });

    render(<LocaleNotFound />);

    expect(localeNotFoundPageMock).toHaveBeenCalledWith({ locale: 'en' });
  });
});
