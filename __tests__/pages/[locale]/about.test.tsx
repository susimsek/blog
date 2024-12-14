import React from 'react';
import { render, screen } from '@testing-library/react';
import { Provider } from 'react-redux';
import store from '@/config/store';
import About, { getStaticPaths, getStaticProps } from '@/pages/[locale]/about';
import '@testing-library/jest-dom';
import { useTranslation } from 'next-i18next';

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

beforeEach(() => {
  (useTranslation as jest.Mock).mockReturnValue({
    t: (key: string) => key, // Mock translation function
  });
});

// Mock FontAwesomeIcon
jest.mock('@fortawesome/react-fontawesome', () => ({
  FontAwesomeIcon: ({ icon }: { icon: string | [string, string] }) => {
    const iconName = Array.isArray(icon) ? icon.join('-') : icon;
    return <i data-testid={`font-awesome-icon-${iconName}`} />;
  },
}));

jest.mock('@/components/common/ContactInfo', () => () => <div data-testid="contact-info" />);

jest.mock('@assets/images/logo.svg', () => ({
  __esModule: true,
  ReactComponent: () => <svg data-testid="mock-logo" />,
}));

describe('About Page', () => {
  it('renders the navigation and main content', async () => {
    render(
      <Provider store={store}>
        <About />
      </Provider>,
    );

    // Navigation
    expect(screen.getByRole('navigation')).toBeInTheDocument();

    // Main content
    expect(screen.getByRole('main')).toBeInTheDocument();
  });

  it('renders the about header and description', async () => {
    render(
      <Provider store={store}>
        <About />
      </Provider>,
    );

    // Header
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('about.header');

    // Description
    expect(screen.getByText('about.description')).toBeInTheDocument();
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
          ns: ['about', 'common'],
        }),
      },
    });
  });
});
