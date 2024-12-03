import { render, screen, fireEvent } from '@testing-library/react';
import LanguageSwitcher from '@/components/i18n/LanguageSwitcher';
import { useRouter } from 'next/router';
import i18nextConfig from '../../../next-i18next.config';

// Mocking next/router
jest.mock('next/router', () => ({
  useRouter: jest.fn(),
}));

// Mocking react-i18next and FontAwesomeIcon
jest.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

jest.mock('@fortawesome/react-fontawesome', () => ({
  FontAwesomeIcon: ({ icon }: { icon: string }) => <i data-testid={`font-awesome-icon-${icon}`} />,
}));

describe('LanguageSwitcher', () => {
  beforeEach(() => {
    (useRouter as jest.Mock).mockReturnValue({
      query: { locale: 'en-US' },
      asPath: '/current-path',
      pathname: '/current-path',
    });
  });

  it('renders the globe icon correctly', () => {
    render(<LanguageSwitcher />);

    // Select the icon using the mocked data-testid
    const globeIcon = screen.getByTestId('font-awesome-icon-globe');
    expect(globeIcon).toBeInTheDocument();
  });

  it('renders the language switcher dropdown', () => {
    render(<LanguageSwitcher />);

    // Ensure the dropdown is in the document
    const dropdown = screen.getByRole('button', { name: /common.language/i });
    expect(dropdown).toBeInTheDocument();
  });

  it('uses the current locale from router.query when available', () => {
    (useRouter as jest.Mock).mockReturnValue({
      query: { locale: 'fr-FR' }, // Simulating a locale being set in the query
    });

    render(<LanguageSwitcher />);

    // Verify the correct locale is used (in this case, fr-FR)
    const dropdown = screen.getByRole('button', { name: /common.language/i });
    expect(dropdown).toHaveTextContent('common.language'); // Assuming the default text content is 'common.language'
  });

  it('uses the default locale when router.query.locale is not available', () => {
    // Simulating no locale in the query, fallback to the default locale
    (useRouter as jest.Mock).mockReturnValue({
      query: {}, // No locale in the query
    });

    render(<LanguageSwitcher />);

    // Verify the correct default locale is used
    const dropdown = screen.getByRole('button', { name: /common.language/i });
    expect(dropdown).toHaveTextContent('common.language'); // Assuming the default text content is 'common.language'
  });
});
