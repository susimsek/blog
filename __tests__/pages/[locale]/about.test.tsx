import React from 'react';
import { render, screen } from '@testing-library/react';
import { Provider } from 'react-redux';
import store from '@/config/store';
import About, { getStaticPaths, getStaticProps } from '@/pages/[locale]/about';
import '@testing-library/jest-dom';
import { useTranslation } from 'next-i18next';
import { mockPosts, mockPostSummaries, mockTopics } from '../../__mocks__/mockPostData';

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

// Mock Layout component
jest.mock('@/components/common/Layout', () => ({
  __esModule: true,
  default: ({ children }: { children: React.ReactNode }) => <div data-testid="mock-layout">{children}</div>,
}));

beforeEach(() => {
  (useTranslation as jest.Mock).mockReturnValue({
    t: (key: string) => key, // Mock translation function
  });
});

beforeAll(() => {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: jest.fn().mockImplementation(query => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: jest.fn(),
      removeListener: jest.fn(),
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
      dispatchEvent: jest.fn(),
    })),
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

// Mock `makePostProps` function
jest.mock('@/lib/posts', () => ({
  makePostProps: jest.fn().mockImplementation(() => async () => ({
    props: {
      posts: mockPosts,
    },
  })),
}));

describe('About Page', () => {
  it('renders the about header and description', async () => {
    render(
      <Provider store={store}>
        <About posts={mockPostSummaries} topics={mockTopics} />
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
        posts: mockPosts,
      },
    });
  });
});
