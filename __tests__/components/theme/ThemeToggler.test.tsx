import React from 'react';
import { render, screen, fireEvent, within, act } from '@testing-library/react';
import ThemeToggler from '@/components/theme/ThemeToggler';
import { setTheme } from '@/reducers/theme';
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

  it('renders the dropdown with the correct icon and label', () => {
    (useAppSelector as jest.Mock).mockReturnValue('light');

    render(<ThemeToggler />);

    const dropdown = screen.getByText(/common.theme/i);
    const paletteIcon = screen.getByTestId('font-awesome-icon-palette');

    expect(dropdown).toBeInTheDocument();
    expect(paletteIcon).toBeInTheDocument();
  });

  it('renders light theme option as active when the current theme is light', () => {
    (useAppSelector as jest.Mock).mockReturnValue('light');

    render(<ThemeToggler />);

    const dropdownToggle = screen.getByRole('button', { name: /common.theme/i });
    fireEvent.click(dropdownToggle);

    const lightOption = screen.getByRole('button', { name: /common.header.theme.light/i });
    const checkIcon = within(lightOption).getByTestId('font-awesome-icon-circle-check');

    expect(lightOption).toBeInTheDocument();
    expect(checkIcon).toBeInTheDocument();
  });

  it('renders dark theme option as active when the current theme is dark', async () => {
    (useAppSelector as jest.Mock).mockReturnValue('dark');

    render(<ThemeToggler />);

    const dropdownToggle = screen.getByRole('button', { name: /common.theme/i });
    await act(async () => {
      fireEvent.click(dropdownToggle);
    });

    const darkOption = screen.getByRole('button', { name: /common.header.theme.dark/i });
    const checkIcon = within(darkOption).getByTestId('font-awesome-icon-circle-check');

    expect(darkOption).toBeInTheDocument();
    expect(checkIcon).toBeInTheDocument();
  });

  it('dispatches setTheme action when selecting a new theme', async () => {
    (useAppSelector as jest.Mock).mockReturnValue('light');

    render(<ThemeToggler />);

    const dropdownToggle = screen.getByRole('button', { name: /common.theme/i });
    await act(async () => {
      fireEvent.click(dropdownToggle);
    });

    const darkOption = screen.getByRole('button', {
      name: /common.header.theme.dark/i,
    });
    await act(async () => {
      fireEvent.click(darkOption);
    });

    expect(mockDispatch).toHaveBeenCalledTimes(1);
    expect(mockDispatch).toHaveBeenCalledWith(setTheme('dark'));
  });

  it('does not dispatch setTheme if the selected theme matches the current theme', () => {
    (useAppSelector as jest.Mock).mockReturnValue('light');

    render(<ThemeToggler />);

    const dropdownToggle = screen.getByRole('button', { name: /common.theme/i });
    fireEvent.click(dropdownToggle);

    const lightOption = screen.getByText(/common.header.theme.light/i);
    fireEvent.click(lightOption);

    expect(mockDispatch).not.toHaveBeenCalled();
  });

  it('renders the correct icons for light and dark options', () => {
    (useAppSelector as jest.Mock).mockReturnValue('light');

    render(<ThemeToggler />);

    const dropdownToggle = screen.getByRole('button', {
      name: /common.theme/i,
    });
    fireEvent.click(dropdownToggle);

    const sunIcon = screen.getByTestId('font-awesome-icon-sun');
    const moonIcon = screen.getByTestId('font-awesome-icon-moon');

    expect(sunIcon).toBeInTheDocument();
    expect(moonIcon).toBeInTheDocument();
  });

  it('renders and selects the oceanic option', async () => {
    (useAppSelector as jest.Mock).mockReturnValue('oceanic');

    render(<ThemeToggler />);

    const dropdownToggle = screen.getByRole('button', { name: /common.theme/i });
    await act(async () => {
      fireEvent.click(dropdownToggle);
    });

    const oceanicOption = screen.getByRole('button', {
      name: /common.header.theme.oceanic/i,
    });

    expect(oceanicOption).toBeInTheDocument();
    const checkIcon = within(oceanicOption).getByTestId('font-awesome-icon-circle-check');
    expect(checkIcon).toBeInTheDocument();
    expect(mockDispatch).not.toHaveBeenCalled();
  });
});
