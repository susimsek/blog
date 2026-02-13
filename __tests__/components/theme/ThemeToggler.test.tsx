import React from 'react';
import { render, screen, fireEvent, within, act } from '@testing-library/react';
import ThemeToggler from '@/components/theme/ThemeToggler';
import { resetToSystemTheme, setTheme } from '@/reducers/theme';
import { useAppDispatch, useAppSelector } from '@/config/store';

const useAppDispatchMock = useAppDispatch as unknown as jest.Mock;
const useAppSelectorMock = useAppSelector as unknown as jest.Mock;

jest.mock('@/config/store', () => ({
  useAppDispatch: jest.fn(),
  useAppSelector: jest.fn(),
}));

jest.mock('react-i18next', () => ({
  useTranslation: jest.fn(() => ({
    t: jest.fn((key: string) => key),
  })),
}));

jest.mock('@fortawesome/react-fontawesome', () => ({
  FontAwesomeIcon: ({ icon, className }: { icon: string; className?: string }) => (
    <span data-testid={`font-awesome-icon-${icon}`} className={className} />
  ),
}));

describe('ThemeToggler', () => {
  const mockDispatch = jest.fn();
  const mockPlay = jest.fn().mockResolvedValue(undefined);
  const mockState = {
    theme: { theme: 'light', hasExplicitTheme: true },
    voice: { isEnabled: true },
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (global as typeof globalThis & { Audio: jest.Mock }).Audio = jest.fn().mockImplementation(() => ({
      currentTime: 0,
      play: mockPlay,
      pause: jest.fn(),
      volume: 1,
      playbackRate: 1,
      preload: 'auto',
    }));
    useAppDispatchMock.mockReturnValue(mockDispatch);
    useAppSelectorMock.mockImplementation((selector: (state: typeof mockState) => unknown) => selector(mockState));
    mockState.theme.theme = 'light';
    mockState.theme.hasExplicitTheme = true;
    mockState.voice.isEnabled = true;
  });

  it('renders the dropdown with the correct icon and label', () => {
    render(<ThemeToggler />);

    const dropdown = screen.getByText(/common.theme/i);
    const paletteIcon = screen.getByTestId('font-awesome-icon-palette');

    expect(dropdown).toBeInTheDocument();
    expect(paletteIcon).toBeInTheDocument();
  });

  it('renders light theme option as active when the current theme is light', async () => {
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
    render(<ThemeToggler />);

    const dropdownToggle = screen.getByRole('button', { name: /common.theme/i });
    await act(async () => {
      fireEvent.click(dropdownToggle);
    });

    const darkOption = screen.getByRole('button', { name: /common.header.theme.dark/i });
    await act(async () => {
      fireEvent.click(darkOption);
    });

    expect(mockDispatch).toHaveBeenCalledTimes(1);
    expect(mockDispatch).toHaveBeenCalledWith(setTheme('dark'));
  });

  it('does not dispatch setTheme if the selected theme matches the current theme', async () => {
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

  it('renders the correct icons for theme options', async () => {
    render(<ThemeToggler />);

    const dropdownToggle = screen.getByRole('button', { name: /common.theme/i });
    await act(async () => {
      fireEvent.click(dropdownToggle);
    });

    expect(screen.getByTestId('font-awesome-icon-desktop')).toBeInTheDocument();
    expect(screen.getByTestId('font-awesome-icon-sun')).toBeInTheDocument();
    expect(screen.getByTestId('font-awesome-icon-moon')).toBeInTheDocument();
    expect(screen.getByTestId('font-awesome-icon-water')).toBeInTheDocument();
    expect(screen.getByTestId('font-awesome-icon-leaf')).toBeInTheDocument();
  });

  it('renders and selects the oceanic option', async () => {
    mockState.theme.theme = 'oceanic';

    render(<ThemeToggler />);

    const dropdownToggle = screen.getByRole('button', { name: /common.theme/i });
    await act(async () => {
      fireEvent.click(dropdownToggle);
    });

    const oceanicOption = screen.getByRole('button', { name: /common.header.theme.oceanic/i });

    expect(oceanicOption).toBeInTheDocument();
    const checkIcon = within(oceanicOption).getByTestId('font-awesome-icon-circle-check');
    expect(checkIcon).toBeInTheDocument();
    expect(mockDispatch).not.toHaveBeenCalled();
  });

  it('renders and selects the forest option', async () => {
    mockState.theme.theme = 'forest';

    render(<ThemeToggler />);

    const dropdownToggle = screen.getByRole('button', { name: /common.theme/i });
    await act(async () => {
      fireEvent.click(dropdownToggle);
    });

    const forestOption = screen.getByRole('button', { name: /common.header.theme.forest/i });

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

  it('does not show voice controls inside theme menu', async () => {
    render(<ThemeToggler />);

    const dropdownToggle = screen.getByRole('button', { name: /common.theme/i });
    await act(async () => {
      fireEvent.click(dropdownToggle);
    });

    expect(screen.queryByRole('button', { name: /common.header.voice.enabled/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /common.header.voice.disabled/i })).not.toBeInTheDocument();
  });

  it('does not play theme-change sound when voice is disabled', async () => {
    mockState.voice.isEnabled = false;

    render(<ThemeToggler />);

    const dropdownToggle = screen.getByRole('button', { name: /common.theme/i });
    await act(async () => {
      fireEvent.click(dropdownToggle);
    });

    const darkOption = screen.getByRole('button', { name: /common.header.theme.dark/i });
    await act(async () => {
      fireEvent.click(darkOption);
    });

    expect(global.Audio).not.toHaveBeenCalled();
    expect(mockDispatch).toHaveBeenCalledWith(setTheme('dark'));
  });

  it('renders boop classes on theme icon wrapper', () => {
    render(<ThemeToggler />);

    expect(screen.getByTestId('font-awesome-icon-palette').parentElement).toHaveClass('nav-icon-boop');
    expect(screen.getByTestId('font-awesome-icon-palette')).toHaveClass('icon-boop-target');
  });
});
