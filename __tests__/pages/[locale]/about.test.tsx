import React from 'react';
import { render, screen } from '@testing-library/react';
import { Provider } from 'react-redux';
import store from '@/config/store';
import About from '@/pages/[locale]/about';
import '@testing-library/jest-dom';
import { useTranslation } from 'next-i18next';

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
  FontAwesomeIcon: ({ icon }: { icon: string }) => <i data-testid={`font-awesome-icon-${icon}`} />,
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

  it('renders the social media links', async () => {
    render(
      <Provider store={store}>
        <About />
      </Provider>,
    );

    // Email
    expect(screen.getByRole('link', { name: 'suaybsimsek58@gmail.com' })).toHaveAttribute(
      'href',
      'mailto:suaybsimsek58@gmail.com',
    );

    // LinkedIn
    expect(screen.getByRole('link', { name: 'https://linkedin.com/in/şuayb-şimşek-29b077178' })).toHaveAttribute(
      'href',
      'https://linkedin.com/in/şuayb-şimşek-29b077178',
    );

    // Medium
    expect(screen.getByRole('link', { name: 'https://medium.com/@suaybsimsek58' })).toHaveAttribute(
      'href',
      'https://medium.com/@suaybsimsek58',
    );

    // GitHub
    expect(screen.getByRole('link', { name: 'https://github.com/susimsek' })).toHaveAttribute(
      'href',
      'https://github.com/susimsek',
    );
  });

  it('renders FontAwesome icons correctly', async () => {
    render(
      <Provider store={store}>
        <About />
      </Provider>,
    );

    // Icons
    expect(screen.getByTestId('font-awesome-icon-envelope')).toBeInTheDocument();
    expect(screen.getByTestId('font-awesome-icon-linkedin')).toBeInTheDocument();
    expect(screen.getByTestId('font-awesome-icon-medium')).toBeInTheDocument();
    expect(screen.getByTestId('font-awesome-icon-github')).toBeInTheDocument();
  });
});
