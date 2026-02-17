import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import Link from '@/components/common/Link';

const mockNextLinkComponent = jest.fn(({ children, locale, ...props }: any) => (
  <a data-locale={locale === false ? 'false' : (locale ?? '')} {...props}>
    {children}
  </a>
));

const useParamsMock = jest.fn();
const usePathnameMock = jest.fn();

jest.mock('next/link', () => ({
  __esModule: true,
  default: (props: any) => mockNextLinkComponent(props),
}));

jest.mock('next/navigation', () => ({
  useParams: () => useParamsMock(),
  usePathname: () => usePathnameMock(),
}));

describe('Link', () => {
  beforeEach(() => {
    useParamsMock.mockReturnValue({ locale: 'en-US' });
    usePathnameMock.mockReturnValue('/current-path');
    window.history.replaceState({}, '', '/current-path');
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
    expect(link).toHaveAttribute('href', '/en-US/about');
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
    expect(link).toHaveAttribute('href', '/en-US/current-path');
    expect(link).toHaveAttribute('data-locale', 'en-US');
  });

  it('includes current query params when href is not provided', () => {
    window.history.replaceState({}, '', '/current-path?page=2&q=next');

    render(
      <Link>
        <span>Current Path With Query</span>
      </Link>,
    );

    const link = screen.getByText('Current Path With Query').closest('a');
    expect(link).toHaveAttribute('href', '/en-US/current-path?page=2&q=next');
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
    expect(link).toHaveAttribute('href', '/fr-FR/about');
    expect(link).toHaveAttribute('data-locale', 'fr-FR');
  });

  it('falls back to route locale when locale prop is not provided', () => {
    useParamsMock.mockReturnValue({ locale: 'es-ES' });
    render(
      <Link href="/about">
        <span>About Us</span>
      </Link>,
    );

    const link = screen.getByText('About Us').closest('a');
    expect(link).toHaveAttribute('href', '/es-ES/about');
    expect(link).toHaveAttribute('data-locale', 'es-ES');
  });

  it('uses default locale if route locale is not available', () => {
    useParamsMock.mockReturnValue({});
    render(
      <Link href="/about">
        <span>About Us</span>
      </Link>,
    );

    const link = screen.getByText('About Us').closest('a');
    expect(link).toHaveAttribute('href', '/en/about');
    expect(link).toHaveAttribute('data-locale', 'en');
  });
});
