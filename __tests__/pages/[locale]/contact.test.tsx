import React from 'react';
import { render, screen } from '@testing-library/react';
import { Provider } from 'react-redux';
import store from '@/config/store';
import '@testing-library/jest-dom';
import { useTranslation } from 'next-i18next';
import Contact from '@/pages/[locale]/contact';

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

describe('Contact Page', () => {
  it('renders the navigation and main content', () => {
    render(
      <Provider store={store}>
        <Contact />
      </Provider>,
    );

    // Navigation
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

  it('renders the contact information', () => {
    render(
      <Provider store={store}>
        <Contact />
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
});
