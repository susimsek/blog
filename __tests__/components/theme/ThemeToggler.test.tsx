import React from 'react';
import { render, screen, fireEvent, within, act } from '@testing-library/react';
import ThemeToggler from '@/components/theme/ThemeToggler';
import { resetToSystemTheme, setTheme } from '@/reducers/theme';
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
  const mockState = {
    theme: { theme: 'light', hasExplicitTheme: true },
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (useAppDispatch as jest.Mock).mockReturnValue(mockDispatch);
    (useAppSelector as jest.Mock).mockImplementation((selector: (state: typeof mockState) => unknown) =>
      selector(mockState),
    );
    mockState.theme.theme = 'light';
    mockState.theme.hasExplicitTheme = true;
  });

  it('renders the dropdown with the correct icon and label', () => {
    render(<ThemeToggler />);

    const dropdown = screen.getByText(/common.theme/i);
    const paletteIcon = screen.getByTestId('font-awesome-icon-palette');

    expect(dropdown).toBeInTheDocument();
    expect(paletteIcon).toBeInTheDocument();
  });

  it('renders light theme option as active when the current theme is light', async () => {
    mockState.theme.theme = 'light';
    mockState.theme.hasExplicitTheme = true;

    render(<ThemeToggler />);

    const dropdownToggle = screen.getByRole('button', { name: /common.theme/i });
    await act(async () => {
      fireEvent.click(dropdownToggle);
    });

    const lightOption = screen.getByRole('button', { name: /common.header.theme.light/i });
    const checkIcon = within(lightOption).getByTestId('font-awesome-icon-circle-check');

    expect(lightOption).toBeInTheDocument();
    expect(checkIcon).toBeInTheDocument();
  });

  it('renders dark theme option as active when the current theme is dark', async () => {
    mockState.theme.theme = 'dark';
    mockState.theme.hasExplicitTheme = true;

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
    mockState.theme.theme = 'light';
    mockState.theme.hasExplicitTheme = true;

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

  it('does not dispatch setTheme if the selected theme matches the current theme', async () => {
    mockState.theme.theme = 'light';
    mockState.theme.hasExplicitTheme = true;

    render(<ThemeToggler />);

    const dropdownToggle = screen.getByRole('button', { name: /common.theme/i });
    await act(async () => {
      fireEvent.click(dropdownToggle);
    });

    const lightOption = screen.getByText(/common.header.theme.light/i);
    await act(async () => {
      fireEvent.click(lightOption);
    });

    expect(mockDispatch).not.toHaveBeenCalled();
  });

  it('renders the correct icons for light and dark options', async () => {
    mockState.theme.theme = 'light';
    mockState.theme.hasExplicitTheme = true;

    render(<ThemeToggler />);

    const dropdownToggle = screen.getByRole('button', {
      name: /common.theme/i,
    });
    await act(async () => {
      fireEvent.click(dropdownToggle);
    });

    const desktopIcon = screen.getByTestId('font-awesome-icon-desktop');
    const sunIcon = screen.getByTestId('font-awesome-icon-sun');
    const moonIcon = screen.getByTestId('font-awesome-icon-moon');
    const waterIcon = screen.getByTestId('font-awesome-icon-water');
    const leafIcon = screen.getByTestId('font-awesome-icon-leaf');

    expect(desktopIcon).toBeInTheDocument();
    expect(sunIcon).toBeInTheDocument();
    expect(moonIcon).toBeInTheDocument();
    expect(waterIcon).toBeInTheDocument();
    expect(leafIcon).toBeInTheDocument();
  });

  it('renders and selects the oceanic option', async () => {
    mockState.theme.theme = 'oceanic';
    mockState.theme.hasExplicitTheme = true;

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

  it('renders and selects the forest option', async () => {
    mockState.theme.theme = 'forest';
    mockState.theme.hasExplicitTheme = true;

    render(<ThemeToggler />);

    const dropdownToggle = screen.getByRole('button', { name: /common.theme/i });
    await act(async () => {
      fireEvent.click(dropdownToggle);
    });

    const forestOption = screen.getByRole('button', {
      name: /common.header.theme.forest/i,
    });

    expect(forestOption).toBeInTheDocument();
    const checkIcon = within(forestOption).getByTestId('font-awesome-icon-circle-check');
    expect(checkIcon).toBeInTheDocument();
    expect(mockDispatch).not.toHaveBeenCalled();
  });

  it('renders system theme option as active when no explicit theme is set', async () => {
    mockState.theme.theme = 'dark';
    mockState.theme.hasExplicitTheme = false;

    render(<ThemeToggler />);

    const dropdownToggle = screen.getByRole('button', { name: /common.theme/i });
    await act(async () => {
      fireEvent.click(dropdownToggle);
    });

    const systemOption = screen.getByRole('button', { name: /common.header.theme.system/i });
    const checkIcon = within(systemOption).getByTestId('font-awesome-icon-circle-check');

    expect(systemOption).toBeInTheDocument();
    expect(checkIcon).toBeInTheDocument();
  });

  it('dispatches resetToSystemTheme when selecting system theme', async () => {
    mockState.theme.theme = 'dark';
    mockState.theme.hasExplicitTheme = true;

    render(<ThemeToggler />);

    const dropdownToggle = screen.getByRole('button', { name: /common.theme/i });
    await act(async () => {
      fireEvent.click(dropdownToggle);
    });

    const systemOption = screen.getByRole('button', { name: /common.header.theme.system/i });
    await act(async () => {
      fireEvent.click(systemOption);
    });

    expect(mockDispatch).toHaveBeenCalledWith(resetToSystemTheme());
  });
});
