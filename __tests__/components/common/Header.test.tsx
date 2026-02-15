import { act, fireEvent, render, screen } from '@testing-library/react';
import { useTranslation } from 'react-i18next';
import useMediaQuery from '@/hooks/useMediaQuery';

type HeaderComponent = typeof import('@/components/common/Header').default;
let Header: HeaderComponent;

// Mock `react-i18next`
jest.mock('react-i18next', () => ({
  useTranslation: jest.fn(),
}));

jest.mock('@/hooks/useMediaQuery', () => ({
  __esModule: true,
  default: jest.fn(),
}));

// Mock `Link` component
jest.mock('@/components/common/Link', () => ({
  __esModule: true,
  default: ({ children, ...props }: any) => <a {...props}>{children}</a>,
}));

// Mock `LanguageSwitcher` component
jest.mock('@/components/i18n/LanguageSwitcher', () => ({
  __esModule: true,
  default: () => <div data-testid="language-switcher">LanguageSwitcher</div>,
}));

// Mock `ThemeToggler` component
jest.mock('@/components/theme/ThemeToggler', () => ({
  __esModule: true,
  default: () => <div data-testid="theme-toggler">ThemeToggler</div>,
}));

// Mock `VoiceToggler` component
jest.mock('@/components/voice/VoiceToggler', () => ({
  __esModule: true,
  default: () => <div data-testid="voice-toggler">VoiceToggler</div>,
}));

// Mock `FontAwesomeIcon` component
jest.mock('@fortawesome/react-fontawesome', () => ({
  FontAwesomeIcon: ({ icon, className }: { icon: string; className?: string }) => (
    <i data-testid={`font-awesome-icon-${icon}`} className={className} />
  ),
}));

jest.mock('@/components/search/SearchContainer', () => ({
  __esModule: true,
  default: ({ shortcutHint }: any) => (
    <div data-testid="search-container">
      SearchContainer{shortcutHint ? ` ${shortcutHint.modifier}${shortcutHint.key}` : ''}
    </div>
  ),
}));

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

describe('Header', () => {
  beforeAll(() => {
    Header = require('@/components/common/Header').default;
  });

  beforeEach(() => {
    (useTranslation as jest.Mock).mockReturnValue({
      t: (key: string) => key, // Mock translation function
    });
    (useMediaQuery as jest.Mock).mockReturnValue(false);
  });

  it('renders the navigation links with icons', () => {
    render(<Header />);

    // Verify the "home" link and its associated icon
    const homeLink = screen.getByText('common.header.menu.home').closest('a');
    expect(homeLink).toBeInTheDocument();
    const homeIcon = screen.getByTestId('font-awesome-icon-home');
    expect(homeIcon).toBeInTheDocument();

    // Verify the "about" link and its associated icon
    const aboutLink = screen.getByText('common.header.menu.about').closest('a');
    expect(aboutLink).toBeInTheDocument();
    const aboutIcon = screen.getByTestId('font-awesome-icon-info-circle');
    expect(aboutIcon).toBeInTheDocument();

    // Verify the "contact" link and its associated icon
    const contactLink = screen.getByText('common.header.menu.contact').closest('a');
    expect(contactLink).toBeInTheDocument();
    const contactIcon = screen.getByTestId('font-awesome-icon-address-book');
    expect(contactIcon).toBeInTheDocument();
  });

  it('renders the LanguageSwitcher component', () => {
    render(<Header />);
    const languageSwitcher = screen.getByTestId('language-switcher');
    expect(languageSwitcher).toBeInTheDocument();
  });

  it('renders the ThemeToggler component', () => {
    render(<Header />);
    const themeToggler = screen.getByTestId('theme-toggler');
    expect(themeToggler).toBeInTheDocument();
  });

  it('renders the VoiceToggler component', () => {
    render(<Header />);
    const voiceToggler = screen.getByTestId('voice-toggler');
    expect(voiceToggler).toBeInTheDocument();
  });

  it('renders the navbar toggle button with the correct icon', () => {
    render(<Header />);

    // Ensure the toggle button is present
    const toggleButton = screen.getByRole('button', { name: /toggle navigation/i });
    expect(toggleButton).toBeInTheDocument();

    // Ensure the toggle button has the "bars" icon
    const toggleIcon = screen.getByTestId('font-awesome-icon-bars');
    expect(toggleIcon).toBeInTheDocument();
  });

  it('toggles tablet search mode when search button is clicked', () => {
    (useMediaQuery as jest.Mock).mockReturnValue(true);
    render(<Header searchEnabled />);

    const openSearchBtn = screen.getByRole('button', { name: 'common.header.actions.showSearch' });
    fireEvent.click(openSearchBtn);
    expect(screen.getByLabelText('common.header.actions.hideSearch')).toBeInTheDocument();
    expect(screen.getByTestId('search-container')).toBeInTheDocument();

    const closeSearchBtn = screen.getByLabelText('common.header.actions.hideSearch');
    fireEvent.click(closeSearchBtn);
    expect(screen.getByRole('button', { name: 'common.header.actions.showSearch' })).toBeInTheDocument();
  });

  it('opens and focuses search with Ctrl/Cmd+K on tablet', () => {
    (useMediaQuery as jest.Mock).mockReturnValue(true);
    const rafSpy = jest.spyOn(window, 'requestAnimationFrame').mockImplementation(callback => {
      callback(0);
      return 1;
    });
    const dispatchSpy = jest.spyOn(window, 'dispatchEvent');

    render(<Header searchEnabled />);
    fireEvent.keyDown(window, { key: 'k', ctrlKey: true });

    expect(screen.getByLabelText('common.header.actions.hideSearch')).toBeInTheDocument();
    expect(dispatchSpy).toHaveBeenCalledWith(expect.objectContaining({ type: 'app:search-focus' }));

    dispatchSpy.mockRestore();
    rafSpy.mockRestore();
  });

  it('closes tablet search with Escape and dispatches close event', async () => {
    (useMediaQuery as jest.Mock).mockReturnValue(true);
    const dispatchSpy = jest.spyOn(window, 'dispatchEvent');

    render(<Header searchEnabled />);

    fireEvent.click(screen.getByRole('button', { name: 'common.header.actions.showSearch' }));
    expect(screen.getByLabelText('common.header.actions.hideSearch')).toBeInTheDocument();

    await act(async () => {
      await Promise.resolve();
    });

    fireEvent.keyDown(window, { key: 'Escape' });

    expect(screen.getByRole('button', { name: 'common.header.actions.showSearch' })).toBeInTheDocument();
    expect(dispatchSpy).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'app:search-close', detail: { clearQuery: true } }),
    );

    dispatchSpy.mockRestore();
  });

  it('renders search icon with boop classes', () => {
    render(<Header searchEnabled />);

    const searchButton = screen.getByRole('button', { name: 'common.header.actions.showSearch' });
    expect(searchButton).toHaveClass('nav-icon-boop');
    expect(screen.getByTestId('font-awesome-icon-search')).toHaveClass('icon-boop-target');
  });
});
