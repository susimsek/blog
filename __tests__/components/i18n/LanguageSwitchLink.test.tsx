import { render, screen, fireEvent } from '@testing-library/react';
import LanguageSwitchLink from '@/components/i18n/LanguageSwitchLink';
import { useRouter } from 'next/router';
import languageDetector from '@/lib/languageDetector';

// Mocking next/router
jest.mock('next/router', () => ({
  useRouter: jest.fn(),
}));

// Mocking languageDetector
jest.mock('@/lib/languageDetector', () => ({
  cache: jest.fn(),
}));

describe('LanguageSwitchLink', () => {
  beforeEach(() => {
    (useRouter as jest.Mock).mockReturnValue({
      query: { locale: 'en-US' },
      asPath: '/current-path',
      pathname: '/current-path',
      push: jest.fn(),
    });
  });

  it('renders the button with the correct locale', () => {
    render(<LanguageSwitchLink locale="fr-FR" />);

    const button = screen.getByRole('button');
    expect(button).toHaveTextContent('FR');
  });

  it('generates the correct href for the locale', () => {
    const pushMock = jest.fn(); // Mock the router push function
    (useRouter as jest.Mock).mockReturnValue({
      query: { locale: 'en-US' },
      asPath: '/current-path',
      pathname: '/current-path',
      push: pushMock,
    });

    render(<LanguageSwitchLink locale="fr-FR" href="/about" />);

    const button = screen.getByRole('button');
    fireEvent.click(button);

    // Check if router.push was called with the expected URL
    expect(pushMock).toHaveBeenCalledWith('/fr-FR/about');
  });

  it('modifies the href for the current path when no href is provided', () => {
    const pushMock = jest.fn(); // Mock the router push function
    (useRouter as jest.Mock).mockReturnValue({
      query: { locale: 'en-US' },
      asPath: '/current-path',
      pathname: '/current-path',
      push: pushMock,
    });

    render(<LanguageSwitchLink locale="fr-FR" />);

    const button = screen.getByRole('button');
    fireEvent.click(button);

    // Check if router.push was called with the expected URL
    expect(pushMock).toHaveBeenCalledWith('/fr-FR/current-path');
  });

  it('calls router.push when clicked', () => {
    render(<LanguageSwitchLink locale="fr-FR" />);

    const button = screen.getByRole('button');
    fireEvent.click(button);

    expect(languageDetector.cache).toHaveBeenCalledWith('fr-FR');
    expect(useRouter().push).toHaveBeenCalledWith('/fr-FR/current-path');
  });

  it('does not modify the current path if the locale is the same', () => {
    render(<LanguageSwitchLink locale="en-US" />);

    const button = screen.getByRole('button');
    fireEvent.click(button);

    expect(languageDetector.cache).toHaveBeenCalledWith('en-US');
    expect(useRouter().push).toHaveBeenCalledWith('/en-US/current-path');
  });

  it('calls router.push with the correct path for external URLs', () => {
    const pushMock = jest.fn();
    const cacheMock = jest.fn();

    (useRouter as jest.Mock).mockReturnValue({
      query: { locale: 'fr-FR' },
      asPath: '/current-path',
      pathname: '/current-path',
      push: pushMock,
    });

    languageDetector.cache = cacheMock; // Mock the cache method

    render(<LanguageSwitchLink locale="fr-FR" href="https://example.com" />);

    const button = screen.getByRole('button');
    fireEvent.click(button);

    expect(languageDetector.cache).toHaveBeenCalledWith('fr-FR');
    expect(pushMock).toHaveBeenCalledWith('https://example.com');
  });
});
