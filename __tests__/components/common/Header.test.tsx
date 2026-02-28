import { act, fireEvent, screen } from '@testing-library/react';
import { useTranslation } from 'react-i18next';
import useMediaQuery from '@/hooks/useMediaQuery';
import { renderWithProviders } from '@tests/utils/renderWithProviders';
import useHoverSound from '@/hooks/useHoverSound';

type HeaderComponent = typeof import('@/components/common/Header').default;
let Header: HeaderComponent;
const playCategoriesOpenSound = jest.fn();
const playCategoriesCloseSound = jest.fn();

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

jest.mock('@/hooks/useHoverSound', () => ({
  __esModule: true,
  default: jest.fn(),
}));

jest.mock('@/lib/postCategories', () => ({
  getAllPostCategories: jest.fn(() => [
    { id: 'frontend', name: 'Frontend', icon: 'code' },
    { id: 'testing', name: 'Testing', icon: 'flask' },
  ]),
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
  const setResponsiveState = ({ tablet = false, mobile = false }: { tablet?: boolean; mobile?: boolean }) => {
    (useMediaQuery as jest.Mock).mockImplementation((query: string) => {
      if (query === '(min-width: 768px) and (max-width: 1366px)') {
        return tablet;
      }

      if (query === '(max-width: 991px)') {
        return mobile;
      }

      return false;
    });
  };

  beforeAll(() => {
    Header = require('@/components/common/Header').default;
  });

  beforeEach(() => {
    (useTranslation as jest.Mock).mockReturnValue({
      t: (key: string) => key, // Mock translation function
    });
    (useHoverSound as jest.Mock).mockReset();
    (useHoverSound as jest.Mock)
      .mockReturnValueOnce(playCategoriesOpenSound)
      .mockReturnValueOnce(playCategoriesCloseSound);
    playCategoriesOpenSound.mockClear();
    playCategoriesCloseSound.mockClear();
    setResponsiveState({});
  });

  it('renders the navigation links with icons', () => {
    renderWithProviders(<Header />);

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
    renderWithProviders(<Header />);
    const languageSwitcher = screen.getByTestId('language-switcher');
    expect(languageSwitcher).toBeInTheDocument();
  });

  it('renders the ThemeToggler component', () => {
    renderWithProviders(<Header />);
    const themeToggler = screen.getByTestId('theme-toggler');
    expect(themeToggler).toBeInTheDocument();
  });

  it('renders the VoiceToggler component', () => {
    renderWithProviders(<Header />);
    const voiceToggler = screen.getByTestId('voice-toggler');
    expect(voiceToggler).toBeInTheDocument();
  });

  it('renders the navbar toggle button with the correct icon', () => {
    renderWithProviders(<Header />);

    // Ensure the toggle button is present
    const toggleButton = screen.getByRole('button', { name: /toggle navigation/i });
    expect(toggleButton).toBeInTheDocument();

    // Ensure the toggle button has the "bars" icon
    const toggleIcon = screen.getByTestId('font-awesome-icon-bars');
    expect(toggleIcon).toBeInTheDocument();
  });

  it('toggles tablet search mode when search button is clicked', () => {
    setResponsiveState({ tablet: true });
    renderWithProviders(<Header searchEnabled />);

    const openSearchBtn = screen.getByRole('button', { name: 'common.header.actions.showSearch' });
    fireEvent.click(openSearchBtn);
    expect(screen.getByLabelText('common.header.actions.hideSearch')).toBeInTheDocument();
    expect(screen.getByTestId('search-container')).toBeInTheDocument();

    const closeSearchBtn = screen.getByLabelText('common.header.actions.hideSearch');
    fireEvent.click(closeSearchBtn);
    expect(screen.getByRole('button', { name: 'common.header.actions.showSearch' })).toBeInTheDocument();
  });

  it('opens and focuses search with Ctrl/Cmd+K on tablet', () => {
    setResponsiveState({ tablet: true });
    const rafSpy = jest.spyOn(window, 'requestAnimationFrame').mockImplementation(callback => {
      callback(0);
      return 1;
    });
    const dispatchSpy = jest.spyOn(window, 'dispatchEvent');

    renderWithProviders(<Header searchEnabled />);
    fireEvent.keyDown(window, { key: 'k', ctrlKey: true });

    expect(screen.getByLabelText('common.header.actions.hideSearch')).toBeInTheDocument();
    expect(dispatchSpy).toHaveBeenCalledWith(expect.objectContaining({ type: 'app:search-focus' }));

    dispatchSpy.mockRestore();
    rafSpy.mockRestore();
  });

  it('refocuses the search input when Ctrl/Cmd+K is pressed while search is already open', () => {
    setResponsiveState({ tablet: true });
    const rafSpy = jest.spyOn(window, 'requestAnimationFrame').mockImplementation(callback => {
      callback(0);
      return 1;
    });
    const dispatchSpy = jest.spyOn(window, 'dispatchEvent');

    renderWithProviders(<Header searchEnabled />);

    fireEvent.click(screen.getByRole('button', { name: 'common.header.actions.showSearch' }));
    dispatchSpy.mockClear();

    fireEvent.keyDown(window, { key: 'k', ctrlKey: true });

    expect(dispatchSpy).toHaveBeenCalledWith(expect.objectContaining({ type: 'app:search-focus' }));

    dispatchSpy.mockRestore();
    rafSpy.mockRestore();
  });

  it('closes tablet search with Escape and dispatches close event', async () => {
    setResponsiveState({ tablet: true });
    const dispatchSpy = jest.spyOn(window, 'dispatchEvent');

    renderWithProviders(<Header searchEnabled />);

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
    renderWithProviders(<Header searchEnabled />);

    const searchButton = screen.getByRole('button', { name: 'common.header.actions.showSearch' });
    expect(searchButton).toHaveClass('nav-icon-boop');
    expect(screen.getByTestId('font-awesome-icon-search')).toHaveClass('icon-boop-target');
  });

  it('renders RSS icon link on desktop', () => {
    renderWithProviders(<Header />);

    const rssLink = screen.getByRole('link', { name: 'common.header.actions.openRss' });
    expect(rssLink).toHaveAttribute('href', '/rss.xml');
    expect(rssLink).toHaveClass('nav-icon-boop');
    expect(screen.getByTestId('font-awesome-icon-rss')).toHaveClass('icon-boop-target');
  });

  it('renders mobile header utilities when in mobile layout', () => {
    setResponsiveState({ mobile: true });

    renderWithProviders(<Header searchEnabled />);

    expect(screen.getByRole('button', { name: 'common.header.actions.showSearch' })).toBeInTheDocument();
    expect(screen.getByTestId('language-switcher')).toBeInTheDocument();
    expect(screen.getByTestId('theme-toggler')).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'common.header.actions.openRss' })).not.toBeInTheDocument();
  });

  it('invokes the sidebar toggle callback when the sidebar button is clicked', () => {
    const onSidebarToggle = jest.fn();

    renderWithProviders(<Header sidebarEnabled onSidebarToggle={onSidebarToggle} />);

    fireEvent.click(screen.getByRole('button', { name: 'common.header.actions.toggleSidebar' }));

    expect(onSidebarToggle).toHaveBeenCalledTimes(1);
  });

  it('ignores Ctrl/Cmd+K on editable targets while search is closed', () => {
    renderWithProviders(
      <>
        <input aria-label="editor" />
        <Header searchEnabled />
      </>,
    );

    const input = screen.getByLabelText('editor');
    fireEvent.keyDown(input, { key: 'k', ctrlKey: true });

    expect(screen.queryByLabelText('common.header.actions.hideSearch')).not.toBeInTheDocument();
  });

  it('ignores non-shortcut key presses', () => {
    renderWithProviders(<Header searchEnabled />);

    fireEvent.keyDown(window, { key: 'k' });

    expect(screen.queryByLabelText('common.header.actions.hideSearch')).not.toBeInTheDocument();
  });

  it('renders the Mac shortcut hint when the navigator user agent is macOS', () => {
    const originalNavigator = global.navigator;
    Object.defineProperty(global, 'navigator', {
      configurable: true,
      value: { ...originalNavigator, userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 14_0)' },
    });

    renderWithProviders(<Header searchEnabled />);
    fireEvent.click(screen.getByRole('button', { name: 'common.header.actions.showSearch' }));

    expect(screen.getByTestId('search-container')).toHaveTextContent('⌘K');

    Object.defineProperty(global, 'navigator', {
      configurable: true,
      value: originalNavigator,
    });
  });

  it('falls back to the Ctrl shortcut hint when navigator is unavailable', () => {
    const originalNavigator = global.navigator;
    Object.defineProperty(global, 'navigator', {
      configurable: true,
      value: undefined,
    });

    renderWithProviders(<Header searchEnabled />);
    fireEvent.click(screen.getByRole('button', { name: 'common.header.actions.showSearch' }));

    expect(screen.getByTestId('search-container')).toHaveTextContent('CtrlK');

    Object.defineProperty(global, 'navigator', {
      configurable: true,
      value: originalNavigator,
    });
  });

  it('closes the desktop search overlay when the backdrop is clicked', () => {
    renderWithProviders(<Header searchEnabled />);

    fireEvent.click(screen.getByRole('button', { name: 'common.header.actions.showSearch' }));
    expect(screen.getByLabelText('common.header.actions.hideSearch')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'common.searchBar.placeholder' }));

    expect(screen.queryByLabelText('common.header.actions.hideSearch')).not.toBeInTheDocument();
  });

  it('closes the search overlay on cancel and restores body scroll', () => {
    renderWithProviders(<Header searchEnabled />);

    fireEvent.click(screen.getByRole('button', { name: 'common.header.actions.showSearch' }));
    expect(document.body.style.overflow).toBe('hidden');

    const dialog = screen.getByRole('dialog', { name: 'common.searchBar.placeholder' });
    fireEvent(
      dialog,
      new Event('cancel', {
        bubbles: true,
        cancelable: true,
      }),
    );

    expect(screen.queryByRole('dialog', { name: 'common.searchBar.placeholder' })).not.toBeInTheDocument();
    expect(document.body.style.overflow).toBe('');
  });

  it('expands the navigation when the navbar toggle is clicked', () => {
    renderWithProviders(<Header />);

    const navigation = screen.getByRole('navigation');
    fireEvent.click(screen.getByRole('button', { name: /toggle navigation/i }));

    expect(navigation).toHaveClass('is-mobile-nav-expanded');
    expect(screen.getByTestId('font-awesome-icon-times')).toBeInTheDocument();
  });

  it('plays category open and close sounds when the dropdown is toggled', () => {
    renderWithProviders(<Header />);

    const dropdownToggle = screen.getByRole('button', { name: /common.header.menu.categories/i });
    fireEvent.click(dropdownToggle);
    expect(playCategoriesOpenSound).toHaveBeenCalled();

    playCategoriesCloseSound.mockClear();
    fireEvent.click(dropdownToggle);

    expect(playCategoriesCloseSound).toHaveBeenCalled();
  });

  it('plays game menu open and close sounds when the dropdown is toggled', () => {
    renderWithProviders(<Header />);

    const dropdownToggle = screen.getByRole('button', { name: /common.header.menu.games/i });
    fireEvent.click(dropdownToggle);
    expect(playCategoriesOpenSound).toHaveBeenCalled();

    playCategoriesCloseSound.mockClear();
    fireEvent.click(dropdownToggle);

    expect(playCategoriesCloseSound).toHaveBeenCalled();
  });
});
