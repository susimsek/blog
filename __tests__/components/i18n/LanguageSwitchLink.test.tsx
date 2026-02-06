import { render, screen, fireEvent } from '@testing-library/react';
import LanguageSwitchLink from '@/components/i18n/LanguageSwitchLink';
import { useRouter } from '@/navigation/router';
import languageDetector from '@/lib/languageDetector';

jest.mock('@fortawesome/react-fontawesome', () => ({
  FontAwesomeIcon: ({ icon }: { icon: string }) => <span data-testid={`icon-${icon}`} />,
}));

// Mocking @/navigation/router
jest.mock('@/navigation/router', () => ({
  useRouter: jest.fn(),
}));

// Mocking languageDetector
jest.mock('@/lib/languageDetector', () => ({
  cache: jest.fn(),
}));

jest.mock('@/components/common/FlagIcon', () => {
  return ({ code, alt }: { code: string; alt?: string }) => (
    <span data-testid={`flag-${code.toLowerCase()}`} aria-label={alt}></span>
  );
});

describe('LanguageSwitchLink', () => {
  beforeEach(() => {
    (useRouter as jest.Mock).mockReturnValue({
      query: { locale: 'en-US', id: '123' },
      asPath: '/[locale]/post/[id]',
      pathname: '/[locale]/post/[id]',
      push: jest.fn(),
      replace: jest.fn(),
    });
  });

  it('renders the button with the correct locale text', () => {
    render(<LanguageSwitchLink locale="fr-FR" />);
    const button = screen.getByRole('button');
    expect(button).toHaveTextContent('FR');
  });

  it('replaces dynamic path segments with query parameters', () => {
    const replaceMock = jest.fn();
    (useRouter as jest.Mock).mockReturnValue({
      query: { locale: 'en-US', id: '123' },
      asPath: '/[locale]/post/[id]',
      pathname: '/[locale]/post/[id]',
      replace: replaceMock,
    });

    render(<LanguageSwitchLink locale="fr-FR" />);

    const button = screen.getByRole('button');
    fireEvent.click(button);

    expect(replaceMock).toHaveBeenCalledWith('/fr-FR/post/123');
  });

  it('uses current asPath when href is not provided', () => {
    const replaceMock = jest.fn();
    (useRouter as jest.Mock).mockReturnValue({
      query: { locale: 'en-US' },
      asPath: '/[locale]/dashboard',
      pathname: '/[locale]/dashboard',
      replace: replaceMock,
    });

    render(<LanguageSwitchLink locale="fr-FR" />);

    const button = screen.getByRole('button');
    fireEvent.click(button);

    expect(replaceMock).toHaveBeenCalledWith('/fr-FR/dashboard');
  });

  it('constructs href correctly for internal paths', () => {
    const replaceMock = jest.fn();
    (useRouter as jest.Mock).mockReturnValue({
      query: { locale: 'en-US' },
      asPath: '/current-path',
      pathname: '/current-path',
      replace: replaceMock,
    });

    render(<LanguageSwitchLink locale="fr-FR" href="/about" />);

    const button = screen.getByRole('button');
    fireEvent.click(button);

    expect(replaceMock).toHaveBeenCalledWith('/fr-FR/about');
  });

  it('handles external URLs without modification', () => {
    const replaceMock = jest.fn();
    (useRouter as jest.Mock).mockReturnValue({
      query: { locale: 'en-US' },
      asPath: '/current-path',
      pathname: '/current-path',
      replace: replaceMock,
    });

    render(<LanguageSwitchLink locale="fr-FR" href="https://example.com" />);

    const button = screen.getByRole('button');
    fireEvent.click(button);

    expect(replaceMock).toHaveBeenCalledWith('https://example.com');
  });

  it('calls languageDetector.cache with the selected locale', () => {
    render(<LanguageSwitchLink locale="fr-FR" />);
    const button = screen.getByRole('button');
    fireEvent.click(button);
    expect(languageDetector.cache).toHaveBeenCalledWith('fr-FR');
  });

  it('does not modify the href if the locale matches the current one', () => {
    const replaceMock = jest.fn();
    (useRouter as jest.Mock).mockReturnValue({
      query: { locale: 'fr-FR' },
      asPath: '/[locale]/home',
      pathname: '/[locale]/home',
      replace: replaceMock,
    });

    render(<LanguageSwitchLink locale="fr-FR" />);

    const button = screen.getByRole('button');
    fireEvent.click(button);

    expect(replaceMock).toHaveBeenCalledWith('/fr-FR/home');
  });

  it('prepends locale to the current path if missing', () => {
    const replaceMock = jest.fn();
    (useRouter as jest.Mock).mockReturnValue({
      query: { id: '123' },
      asPath: '/post/[id]',
      pathname: '/post/[id]',
      replace: replaceMock,
    });

    render(<LanguageSwitchLink locale="fr-FR" />);

    const button = screen.getByRole('button');
    fireEvent.click(button);

    expect(replaceMock).toHaveBeenCalledWith('/fr-FR/post/123');
  });

  it('handles missing flag codes gracefully', () => {
    render(<LanguageSwitchLink locale="fr" />);
    expect(screen.getByTestId('flag-fr')).toBeInTheDocument();
    expect(screen.getByText('fr')).toBeInTheDocument();
  });

  it('renders Turkish flag and name for locale "tr"', () => {
    render(<LanguageSwitchLink locale="tr" />);
    expect(screen.getByTestId('flag-tr')).toBeInTheDocument();
    expect(screen.getByText('Türkçe')).toBeInTheDocument();
  });

  it('renders the correct flag and locale name', () => {
    render(<LanguageSwitchLink locale="en" />);
    expect(screen.getByTestId('flag-en')).toBeInTheDocument();
    expect(screen.getByText('English')).toBeInTheDocument();
  });

  it('handles catch-all dynamic segments and keeps non-dynamic query params', () => {
    const replaceMock = jest.fn();
    (useRouter as jest.Mock).mockReturnValue({
      query: {
        locale: 'en',
        slug: ['guides', 'nextjs'],
        tags: ['react', 'ssg'],
        optional: undefined,
      },
      asPath: '/[locale]/docs/[...slug]',
      pathname: '/[locale]/docs/[...slug]',
      replace: replaceMock,
    });

    render(<LanguageSwitchLink locale="tr" />);
    fireEvent.click(screen.getByRole('button'));

    expect(replaceMock).toHaveBeenCalledWith('/tr/docs/guides/nextjs?tags=react&tags=ssg');
  });

  it('normalizes non-prefixed href values', () => {
    const replaceMock = jest.fn();
    (useRouter as jest.Mock).mockReturnValue({
      query: { locale: 'en' },
      asPath: '/[locale]',
      pathname: '/[locale]',
      replace: replaceMock,
    });

    render(<LanguageSwitchLink locale="tr" href="contact" />);
    fireEvent.click(screen.getByRole('button'));
    expect(replaceMock).toHaveBeenCalledWith('/tr/contact');
  });

  it('maps locale root path to localized root', () => {
    const replaceMock = jest.fn();
    (useRouter as jest.Mock).mockReturnValue({
      query: { locale: 'en' },
      asPath: '/en',
      pathname: '/en',
      replace: replaceMock,
    });

    render(<LanguageSwitchLink locale="tr" />);
    fireEvent.click(screen.getByRole('button'));
    expect(replaceMock).toHaveBeenCalledWith('/tr');
  });

  it('ignores undefined dynamic values and keeps scalar query params', () => {
    const replaceMock = jest.fn();
    (useRouter as jest.Mock).mockReturnValue({
      query: { locale: 'en', id: undefined, page: '2' },
      asPath: '/[locale]/post/[id]',
      pathname: '/[locale]/post/[id]',
      replace: replaceMock,
    });

    render(<LanguageSwitchLink locale="tr" />);
    fireEvent.click(screen.getByRole('button'));
    expect(replaceMock).toHaveBeenCalledWith('/tr/post/[id]?page=2');
  });
});
