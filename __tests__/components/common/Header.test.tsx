import { fireEvent, render, screen } from '@testing-library/react';
import type { ComponentType } from 'react';
import { useTranslation } from 'react-i18next';
import useMediaQuery from '@/hooks/useMediaQuery';
import { registerDynamicMock, registerDynamicMockSequence } from '@tests/utils/dynamicMockRegistry';

let Header: ComponentType;

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

// Mock `FontAwesomeIcon` component
jest.mock('@fortawesome/react-fontawesome', () => ({
  FontAwesomeIcon: ({ icon }: { icon: string }) => <i data-testid={`font-awesome-icon-${icon}`} />,
}));

jest.mock('@/components/search/SearchContainer', () => ({
  __esModule: true,
  default: () => <div data-testid="search-container">SearchContainer</div>,
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
    const languageSwitcher = jest.requireMock('@/components/i18n/LanguageSwitcher');
    registerDynamicMock('LanguageSwitcher', languageSwitcher);
    registerDynamicMock('@/components/i18n/LanguageSwitcher', languageSwitcher);

    const themeToggler = jest.requireMock('@/components/theme/ThemeToggler');
    registerDynamicMock('ThemeToggler', themeToggler);
    registerDynamicMock('@/components/theme/ThemeToggler', themeToggler);

    registerDynamicMockSequence([languageSwitcher, themeToggler]);
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
});
