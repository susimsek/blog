import React from 'react';
import { render, screen } from '@testing-library/react';
import { Provider } from 'react-redux';
import store from '@/config/store';
import '@testing-library/jest-dom';
import { useTranslation } from 'next-i18next';
import Contact, { getStaticPaths, getStaticProps } from '@/pages/[locale]/contact';

const mockContext = { locales: ['en', 'tr'], defaultLocale: 'en' };

// Mock `next/router`
jest.mock('next/router', () => ({
  useRouter: jest.fn().mockReturnValue({
    route: '/',
    pathname: '/',
    query: { locale: 'en' },
    asPath: '/',
  }),
}));

// Mock `next-i18next`
jest.mock('next-i18next', () => ({
  useTranslation: jest.fn(),
}));

jest.mock('@/components/common/ContactInfo', () => () => <div data-testid="contact-info" />);

beforeEach(() => {
  (useTranslation as jest.Mock).mockReturnValue({
    t: (key: string) => key, // Mock translation function
  });
});

// Mock FontAwesomeIcon
jest.mock('@fortawesome/react-fontawesome', () => ({
  FontAwesomeIcon: ({ icon }: { icon: string }) => <i data-testid={`font-awesome-icon-${icon}`} />,
}));

jest.mock('@assets/images/logo.svg', () => ({
  __esModule: true,
  ReactComponent: () => <svg data-testid="mock-logo" />,
}));

describe('Contact Page', () => {
  it('renders the page title and meta tags', () => {
    render(
      <Provider store={store}>
        <Contact />
      </Provider>,
    );

    expect(screen.getByRole('navigation')).toBeInTheDocument();

    // Main content
    expect(screen.getByRole('main')).toBeInTheDocument();
  });

  it('renders the contact header and description', () => {
    render(
      <Provider store={store}>
        <Contact />
      </Provider>,
    );

    // Header
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('contact.header');

    // Description
    expect(screen.getByText('contact.description')).toBeInTheDocument();
  });
});

describe('getStaticPaths', () => {
  it('returns correct paths for all supported locales', async () => {
    const result = await getStaticPaths(mockContext);

    expect(result).toEqual({
      paths: [{ params: { locale: 'en' } }, { params: { locale: 'tr' } }],
      fallback: false,
    });
  });
});

describe('getStaticProps', () => {
  it('returns props with correct namespaces', async () => {
    const context = {
      params: { locale: 'en' },
    };

    const result = await getStaticProps(context);

    expect(result).toEqual({
      props: {
        _nextI18Next: expect.objectContaining({
          initialLocale: 'en',
          ns: ['contact', 'common'],
        }),
      },
    });
  });
});
