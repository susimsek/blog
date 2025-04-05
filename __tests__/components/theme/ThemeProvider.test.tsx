import React from 'react';
import { render, screen } from '@testing-library/react';
import ThemeProvider from '@/components/theme/ThemeProvider';
import { useAppSelector } from '@/config/store';

// Mock store selector
jest.mock('@/config/store', () => ({
  useAppSelector: jest.fn(),
}));

// Mock Loading component
jest.mock('@/components/common/Loading', () => () => <div data-testid="loading-component">Loading...</div>);

describe('ThemeProvider', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders children after client-side rendering', async () => {
    // Mock Redux selector to return "light" theme
    (useAppSelector as jest.Mock).mockReturnValue('light');

    render(
      <ThemeProvider>
        <div data-testid="child-content">Child Content</div>
      </ThemeProvider>,
    );

    // Simulate client-side rendering by waiting for Loading to be removed
    expect(await screen.findByTestId('child-content')).toBeInTheDocument();

    // "Loading" component should no longer be in the document
    expect(screen.queryByTestId('loading-component')).not.toBeInTheDocument();
  });

  it('applies the theme class to the body element', () => {
    // Mock Redux selector to return "dark" theme
    (useAppSelector as jest.Mock).mockReturnValue('dark');

    render(
      <ThemeProvider>
        <div data-testid="child-content">Child Content</div>
      </ThemeProvider>,
    );

    // Simulate client-side rendering by triggering useEffect
    expect(document.body.className).toBe('dark-theme');
  });

  it('renders children after client-side rendering', () => {
    // Mock Redux selector to return "light" theme
    (useAppSelector as jest.Mock).mockReturnValue('light');

    render(
      <ThemeProvider>
        <div data-testid="child-content">Child Content</div>
      </ThemeProvider>,
    );

    // Simulate client-side rendering
    expect(screen.queryByTestId('loading-component')).not.toBeInTheDocument();

    // Child content should now be visible
    expect(screen.getByTestId('child-content')).toBeInTheDocument();
  });
});
