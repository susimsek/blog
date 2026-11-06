import React from 'react';
import { render, screen } from '@testing-library/react';
import Localized404Page, { metadata } from '@/app/(localized)/[locale]/404/page';
import LocaleNotFound from '@/app/(localized)/[locale]/not-found';

const localeNotFoundPageMock = jest.fn(() => <div data-testid="locale-not-found-page">localized-404</div>);

jest.mock('@/views/LocaleNotFoundPage', () => ({
  __esModule: true,
  default: () => localeNotFoundPageMock(),
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

  it('renders the localized 404 page without requiring a locale prop', () => {
    render(<Localized404Page />);

    expect(localeNotFoundPageMock).toHaveBeenCalledTimes(1);
    expect(screen.getByTestId('locale-not-found-page')).toHaveTextContent('localized-404');
  });

  it('renders not-found boundary in the route locale context', () => {
    render(<LocaleNotFound />);

    expect(localeNotFoundPageMock).toHaveBeenCalledTimes(1);
    expect(screen.getByTestId('locale-not-found-page')).toHaveTextContent('localized-404');
  });
});
