import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import Link from '@/components/common/Link';
import { useRouter } from 'next/router';

const mockNextLinkComponent = jest.fn(({ children, locale, ...props }: any) => (
  <a data-locale={locale === false ? 'false' : (locale ?? '')} {...props}>
    {children}
  </a>
));

jest.mock('next/link', () => ({
  __esModule: true,
  default: (props: any) => mockNextLinkComponent(props),
}));

// Mock `next/router`
jest.mock('next/router', () => ({
  useRouter: jest.fn(),
}));

describe('Link', () => {
  beforeEach(() => {
    (useRouter as jest.Mock).mockReturnValue({
      query: { locale: 'en-US' },
      asPath: '/current-path',
      pathname: '/current-path',
      locale: 'en-US',
      defaultLocale: 'en-US',
    });
  });

  afterEach(() => {
    mockNextLinkComponent.mockClear();
  });

  it('renders children correctly', () => {
    render(
      <Link href="/about">
        <span>About Us</span>
      </Link>,
    );

    expect(screen.getByText('About Us')).toBeInTheDocument();
  });

  it('applies the default className', () => {
    render(
      <Link href="/about">
        <span>About Us</span>
      </Link>,
    );

    const link = screen.getByText('About Us').closest('a');
    expect(link).toHaveClass('link');
  });

  it('applies additional className when provided', () => {
    render(
      <Link href="/about" className="custom-class">
        <span>About Us</span>
      </Link>,
    );

    const link = screen.getByText('About Us').closest('a');
    expect(link).toHaveClass('link custom-class');
  });

  it('passes locale information to next/link when skipLocaleHandling is false', () => {
    render(
      <Link href="/about">
        <span>About Us</span>
      </Link>,
    );

    const link = screen.getByText('About Us').closest('a');
    expect(link).toHaveAttribute('data-locale', 'en-US');
    expect(link).toHaveAttribute('href', '/about');
  });

  it('does not modify href or locale when skipLocaleHandling is true', () => {
    render(
      <Link href="/about" skipLocaleHandling>
        <span>About Us</span>
      </Link>,
    );

    const link = screen.getByText('About Us').closest('a');
    expect(link).toHaveAttribute('href', '/about');
    expect(link).toHaveAttribute('data-locale', 'false');
  });

  it('falls back to router.asPath when href is not provided', () => {
    render(
      <Link>
        <span>Current Path</span>
      </Link>,
    );

    const link = screen.getByText('Current Path').closest('a');
    expect(link).toHaveAttribute('href', '/current-path');
    expect(link).toHaveAttribute('data-locale', 'en-US');
  });

  it('calls onClick handler when clicked', () => {
    const onClickMock = jest.fn();
    render(
      <Link href="/about" onClick={onClickMock}>
        <span>About Us</span>
      </Link>,
    );

    const link = screen.getByText('About Us').closest('a');
    fireEvent.click(link!);

    expect(onClickMock).toHaveBeenCalledTimes(1);
  });

  it('handles Enter keydown events', () => {
    const onClickMock = jest.fn();
    render(
      <Link href="/about" onClick={onClickMock}>
        <span>About Us</span>
      </Link>,
    );

    const link = screen.getByText('About Us').closest('a');
    fireEvent.keyDown(link!, { key: 'Enter' });

    expect(onClickMock).toHaveBeenCalledTimes(1);
  });

  it('handles Space keydown events', () => {
    const onClickMock = jest.fn();
    render(
      <Link href="/about" onClick={onClickMock}>
        <span>About Us</span>
      </Link>,
    );

    const link = screen.getByText('About Us').closest('a');
    fireEvent.keyDown(link!, { key: ' ' });

    expect(onClickMock).toHaveBeenCalledTimes(1);
  });

  it('does not call onClick for other keydown events', () => {
    const onClickMock = jest.fn();
    render(
      <Link href="/about" onClick={onClickMock}>
        <span>About Us</span>
      </Link>,
    );

    const link = screen.getByText('About Us').closest('a');
    fireEvent.keyDown(link!, { key: 'Tab' });

    expect(onClickMock).not.toHaveBeenCalled();
  });

  it('does not append locale data for external URLs', () => {
    render(
      <Link href="https://example.com">
        <span>External Link</span>
      </Link>,
    );

    const link = screen.getByText('External Link').closest('a');
    expect(link).toHaveAttribute('href', 'https://example.com');
    expect(link).toHaveAttribute('data-locale', 'false');
  });

  it('uses provided locale when available', () => {
    render(
      <Link href="/about" locale="fr-FR">
        <span>About Us</span>
      </Link>,
    );

    const link = screen.getByText('About Us').closest('a');
    expect(link).toHaveAttribute('href', '/about');
    expect(link).toHaveAttribute('data-locale', 'fr-FR');
  });

  it('falls back to router locale when locale prop is not provided', () => {
    (useRouter as jest.Mock).mockReturnValue({
      query: {},
      asPath: '/fallback',
      pathname: '/fallback',
      locale: 'es-ES',
      defaultLocale: 'en-US',
    });

    render(
      <Link href="/about">
        <span>About Us</span>
      </Link>,
    );

    const link = screen.getByText('About Us').closest('a');
    expect(link).toHaveAttribute('data-locale', 'es-ES');
  });

  it('falls back to default locale if no locale information is available', () => {
    (useRouter as jest.Mock).mockReturnValue({
      query: {},
      asPath: '/fallback',
      pathname: '/fallback',
      defaultLocale: 'en-US',
      locale: undefined,
    });

    render(
      <Link href="/about">
        <span>About Us</span>
      </Link>,
    );

    const link = screen.getByText('About Us').closest('a');
    expect(link).toHaveAttribute('data-locale', 'en-US');
  });

  it('sets locale to false when locale cannot be resolved', () => {
    (useRouter as jest.Mock).mockReturnValue({
      query: {},
      asPath: '/fallback',
      pathname: '/fallback',
      defaultLocale: undefined,
      locale: undefined,
    });

    render(
      <Link href="/about">
        <span>About Us</span>
      </Link>,
    );

    const link = screen.getByText('About Us').closest('a');
    expect(link).toHaveAttribute('data-locale', 'false');
  });
});
