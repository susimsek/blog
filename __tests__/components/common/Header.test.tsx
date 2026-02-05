import { fireEvent, render, screen } from '@testing-library/react';
import Header from '@/components/common/Header';
import { useTranslation } from 'next-i18next';
import useMediaQuery from '@/hooks/useMediaQuery';

// Mock `next-i18next`
jest.mock('next-i18next', () => ({
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

jest.mock('@assets/images/logo.svg', () => ({
  __esModule: true,
  default: () => <svg data-testid="mock-logo" />,
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

    const openSearchBtn = screen.getByRole('button', { name: 'common.header.menu.search' });
    fireEvent.click(openSearchBtn);
    expect(screen.getByLabelText('Hide search')).toBeInTheDocument();
    expect(screen.getByTestId('search-container')).toBeInTheDocument();

    const closeSearchBtn = screen.getByLabelText('Hide search');
    fireEvent.click(closeSearchBtn);
    expect(screen.getByRole('button', { name: 'common.header.menu.search' })).toBeInTheDocument();
  });
});
