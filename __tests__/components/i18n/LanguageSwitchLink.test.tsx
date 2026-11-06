import { fireEvent, render, screen } from '@testing-library/react';
import LanguageSwitchLink from '@/components/i18n/LanguageSwitchLink';

const mockReplace = jest.fn();
let mockPathname = '/posts/example';
let mockParams: { locale?: string } = {};

jest.mock('next/navigation', () => ({
  useRouter: () => ({ replace: mockReplace }),
  usePathname: () => mockPathname,
  useParams: () => mockParams,
}));

jest.mock('@fortawesome/react-fontawesome', () => ({
  FontAwesomeIcon: ({ icon }: { icon: string }) => <span data-testid={`icon-${icon}`} />,
}));

jest.mock('@/components/common/FlagIcon', () => ({
  __esModule: true,
  default: ({ code, alt }: { code: string; alt?: string }) => <span data-testid={`flag-${code}`} aria-label={alt} />,
}));

describe('LanguageSwitchLink', () => {
  beforeEach(() => {
    document.documentElement.lang = 'en';
    window.history.replaceState({}, '', '/posts/example?source=menu#section');
    mockPathname = '/posts/example';
    mockParams = {};
    mockReplace.mockClear();
  });

  it('navigates to the selected locale prefix and preserves the current query and fragment', () => {
    render(<LanguageSwitchLink locale="tr" />);
    fireEvent.click(screen.getByRole('button'));

    expect(mockReplace).toHaveBeenCalledWith('/tr/posts/example?source=menu#section');
  });

  it('removes the locale prefix when switching back to the default language', () => {
    mockPathname = '/tr/posts/example';
    mockParams = { locale: 'tr' };
    window.history.replaceState({}, '', '/tr/posts/example?source=menu');
    render(<LanguageSwitchLink locale="en" />);
    fireEvent.click(screen.getByRole('button'));

    expect(mockReplace).toHaveBeenCalledWith('/posts/example?source=menu');
  });

  it('localizes an explicitly supplied destination path', () => {
    window.history.replaceState({}, '', '/');
    render(<LanguageSwitchLink locale="tr" href="/about" />);
    fireEvent.click(screen.getByRole('button'));

    expect(mockReplace).toHaveBeenCalledWith('/tr/about');
  });

  it('shows the selected-language indicator and ignores unsupported locales', () => {
    render(<LanguageSwitchLink locale="en" />);
    expect(screen.getByTestId('icon-circle-check')).toBeInTheDocument();

    render(<LanguageSwitchLink locale="fr-FR" />);
    fireEvent.click(screen.getAllByRole('button')[1]);
    expect(mockReplace).toHaveBeenCalledTimes(0);
    expect(screen.getByText('fr-FR')).toBeInTheDocument();
  });
});
