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

describe('About Page', () => {
  it('renders the navigation and main content', async () => {
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
});
