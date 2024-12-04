// __tests__/components/theme/ThemeToggler.test.tsx
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import ThemeToggler from '@/components/theme/ThemeToggler';
import { toggleTheme } from '@/reducers/theme';
import { useAppDispatch, useAppSelector } from '@/config/store';

jest.mock('@/config/store', () => ({
  useAppDispatch: jest.fn(),
  useAppSelector: jest.fn(),
}));

jest.mock('next-i18next', () => ({
  useTranslation: jest.fn(() => ({
    t: jest.fn((key: string) => key),
  })),
}));

jest.mock('@fortawesome/react-fontawesome', () => ({
  FontAwesomeIcon: ({ icon }: { icon: string }) => <span data-testid={`font-awesome-icon-${icon}`} />,
}));

describe('ThemeToggler', () => {
  const mockDispatch = jest.fn();

  beforeEach(() => {
    (useAppDispatch as jest.Mock).mockReturnValue(mockDispatch);
    jest.clearAllMocks();
  });

  it('renders the correct icon and text for light theme', () => {
    (useAppSelector as jest.Mock).mockReturnValue('light');

    render(<ThemeToggler />);

    const button = screen.getByRole('button', {
      name: /common.header.themeToggle/i,
    });
    const icon = screen.getByTestId('font-awesome-icon-moon');
    const text = screen.getByText(/common.header.theme.light/i);

    expect(button).toBeInTheDocument();
    expect(icon).toBeInTheDocument();
    expect(text).toBeInTheDocument();
  });

  it('renders the correct icon and text for dark theme', () => {
    (useAppSelector as jest.Mock).mockReturnValue('dark');

    render(<ThemeToggler />);

    const button = screen.getByRole('button', {
      name: /common.header.themeToggle/i,
    });
    const icon = screen.getByTestId('font-awesome-icon-sun');
    const text = screen.getByText(/common.header.theme.dark/i);

    expect(button).toBeInTheDocument();
    expect(icon).toBeInTheDocument();
    expect(text).toBeInTheDocument();
  });

  it('dispatches toggleTheme action when clicked', () => {
    (useAppSelector as jest.Mock).mockReturnValue('light');

    render(<ThemeToggler />);

    const button = screen.getByRole('button', {
      name: /common.header.themeToggle/i,
    });

    fireEvent.click(button);

    expect(mockDispatch).toHaveBeenCalledTimes(1);
    expect(mockDispatch).toHaveBeenCalledWith(toggleTheme());
  });

  it('applies the correct theme-specific class to the button', () => {
    const mockUseAppSelector = useAppSelector as jest.Mock;

    mockUseAppSelector.mockReturnValue('light');
    const { rerender } = render(<ThemeToggler />);

    const button = screen.getByRole('button', {
      name: /common.header.themeToggle/i,
    });

    expect(button).toHaveClass('light');
    expect(button).not.toHaveClass('dark');

    mockUseAppSelector.mockReturnValue('dark');
    rerender(<ThemeToggler />);

    expect(button).toHaveClass('dark');
    expect(button).not.toHaveClass('light');
  });
});
