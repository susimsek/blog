import { render, screen, fireEvent } from '@testing-library/react';
import LanguageSwitchLink from '@/components/i18n/LanguageSwitchLink';
import languageDetector from '@/lib/languageDetector';

const replaceMock = jest.fn();
const useRouterMock = jest.fn();
const usePathnameMock = jest.fn();
const useSearchParamsMock = jest.fn();
const useParamsMock = jest.fn();

jest.mock('next/navigation', () => ({
  useRouter: () => useRouterMock(),
  usePathname: () => usePathnameMock(),
  useSearchParams: () => useSearchParamsMock(),
  useParams: () => useParamsMock(),
}));

jest.mock('@fortawesome/react-fontawesome', () => ({
  FontAwesomeIcon: ({ icon }: { icon: string }) => <span data-testid={`icon-${icon}`} />,
}));

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
    replaceMock.mockReset();
    useRouterMock.mockReturnValue({ replace: replaceMock });
    usePathnameMock.mockReturnValue('/en/post/123');
    useSearchParamsMock.mockReturnValue(new URLSearchParams());
    useParamsMock.mockReturnValue({ locale: 'en' });
  });

  it('renders locale label and flag', () => {
    render(<LanguageSwitchLink locale="tr" />);
    expect(screen.getByTestId('flag-tr')).toBeInTheDocument();
    expect(screen.getByText('Türkçe')).toBeInTheDocument();
  });

  it('uses current pathname when href is not provided', () => {
    render(<LanguageSwitchLink locale="tr" />);
    fireEvent.click(screen.getByRole('button'));

    expect(replaceMock).toHaveBeenCalledWith('/tr/post/123');
  });

  it('normalizes non-prefixed internal href values', () => {
    render(<LanguageSwitchLink locale="tr" href="contact" />);
    fireEvent.click(screen.getByRole('button'));

    expect(replaceMock).toHaveBeenCalledWith('/tr/contact');
  });

  it('constructs href correctly for absolute internal paths', () => {
    render(<LanguageSwitchLink locale="tr" href="/about" />);
    fireEvent.click(screen.getByRole('button'));

    expect(replaceMock).toHaveBeenCalledWith('/tr/about');
  });

  it('handles external URLs without modification', () => {
    render(<LanguageSwitchLink locale="tr" href="https://example.com" />);
    fireEvent.click(screen.getByRole('button'));

    expect(replaceMock).toHaveBeenCalledWith('https://example.com');
  });

  it('keeps non-locale search params', () => {
    useSearchParamsMock.mockReturnValue(new URLSearchParams('locale=en&page=2&tags=react&tags=ssg'));

    render(<LanguageSwitchLink locale="tr" />);
    fireEvent.click(screen.getByRole('button'));

    expect(replaceMock).toHaveBeenCalledWith('/tr/post/123?page=2&tags=react&tags=ssg');
  });

  it('maps locale root path to localized root', () => {
    usePathnameMock.mockReturnValue('/en');

    render(<LanguageSwitchLink locale="tr" />);
    fireEvent.click(screen.getByRole('button'));

    expect(replaceMock).toHaveBeenCalledWith('/tr');
  });

  it('prepends locale when current pathname has no locale prefix', () => {
    usePathnameMock.mockReturnValue('/post/123');
    useParamsMock.mockReturnValue({});

    render(<LanguageSwitchLink locale="tr" />);
    fireEvent.click(screen.getByRole('button'));

    expect(replaceMock).toHaveBeenCalledWith('/tr/post/123');
  });

  it('calls languageDetector.cache with selected locale', () => {
    render(<LanguageSwitchLink locale="tr" />);
    fireEvent.click(screen.getByRole('button'));

    expect(languageDetector.cache).toHaveBeenCalledWith('tr');
  });

  it('shows current-locale indicator when locale matches route locale', () => {
    useParamsMock.mockReturnValue({ locale: 'tr' });

    render(<LanguageSwitchLink locale="tr" />);

    expect(screen.getByTestId('icon-circle-check')).toBeInTheDocument();
  });

  it('falls back to locale code text for unknown locale labels', () => {
    render(<LanguageSwitchLink locale="fr-FR" />);

    expect(screen.getByText('fr-FR')).toBeInTheDocument();
  });
});
