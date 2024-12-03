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
      query: { locale: 'en-US', id: '123' },
      asPath: '/[locale]/post/[id]',
      pathname: '/[locale]/post/[id]',
      push: jest.fn(),
    });
  });

  it('renders the button with the correct locale text', () => {
    render(<LanguageSwitchLink locale="fr-FR" />);
    const button = screen.getByRole('button');
    expect(button).toHaveTextContent('FR');
  });

  it('replaces dynamic path segments with query parameters', () => {
    const pushMock = jest.fn();
    (useRouter as jest.Mock).mockReturnValue({
      query: { locale: 'en-US', id: '123' },
      asPath: '/[locale]/post/[id]',
      pathname: '/[locale]/post/[id]',
      push: pushMock,
    });

    render(<LanguageSwitchLink locale="fr-FR" />);

    const button = screen.getByRole('button');
    fireEvent.click(button);

    expect(pushMock).toHaveBeenCalledWith('/fr-FR/post/123');
  });

  it('uses current asPath when href is not provided', () => {
    const pushMock = jest.fn();
    (useRouter as jest.Mock).mockReturnValue({
      query: { locale: 'en-US' },
      asPath: '/[locale]/dashboard',
      pathname: '/[locale]/dashboard',
      push: pushMock,
    });

    render(<LanguageSwitchLink locale="fr-FR" />);

    const button = screen.getByRole('button');
    fireEvent.click(button);

    expect(pushMock).toHaveBeenCalledWith('/fr-FR/dashboard');
  });

  it('constructs href correctly for internal paths', () => {
    const pushMock = jest.fn();
    (useRouter as jest.Mock).mockReturnValue({
      query: { locale: 'en-US' },
      asPath: '/current-path',
      pathname: '/current-path',
      push: pushMock,
    });

    render(<LanguageSwitchLink locale="fr-FR" href="/about" />);

    const button = screen.getByRole('button');
    fireEvent.click(button);

    expect(pushMock).toHaveBeenCalledWith('/fr-FR/about');
  });

  it('handles external URLs without modification', () => {
    const pushMock = jest.fn();
    (useRouter as jest.Mock).mockReturnValue({
      query: { locale: 'en-US' },
      asPath: '/current-path',
      pathname: '/current-path',
      push: pushMock,
    });

    render(<LanguageSwitchLink locale="fr-FR" href="https://example.com" />);

    const button = screen.getByRole('button');
    fireEvent.click(button);

    expect(pushMock).toHaveBeenCalledWith('https://example.com');
  });

  it('calls languageDetector.cache with the selected locale', () => {
    render(<LanguageSwitchLink locale="fr-FR" />);
    const button = screen.getByRole('button');
    fireEvent.click(button);
    expect(languageDetector.cache).toHaveBeenCalledWith('fr-FR');
  });

  it('does not modify the href if the locale matches the current one', () => {
    const pushMock = jest.fn();
    (useRouter as jest.Mock).mockReturnValue({
      query: { locale: 'fr-FR' },
      asPath: '/[locale]/home',
      pathname: '/[locale]/home',
      push: pushMock,
    });

    render(<LanguageSwitchLink locale="fr-FR" />);

    const button = screen.getByRole('button');
    fireEvent.click(button);

    expect(pushMock).toHaveBeenCalledWith('/fr-FR/home');
  });

  it('prepends locale to the current path if missing', () => {
    const pushMock = jest.fn();
    (useRouter as jest.Mock).mockReturnValue({
      query: { id: '123' },
      asPath: '/post/[id]',
      pathname: '/post/[id]',
      push: pushMock,
    });

    render(<LanguageSwitchLink locale="fr-FR" />);

    const button = screen.getByRole('button');
    fireEvent.click(button);

    expect(pushMock).toHaveBeenCalledWith('/fr-FR/post/123');
  });
});
