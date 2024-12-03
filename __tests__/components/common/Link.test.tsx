import { render, screen, fireEvent } from '@testing-library/react';
import Link from '@/components/common/Link';
import { useRouter } from 'next/router';

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
    });
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

  it('resolves the href with locale when skipLocaleHandling is false', () => {
    render(
      <Link href="/about">
        <span>About Us</span>
      </Link>,
    );

    const link = screen.getByText('About Us').closest('a');
    expect(link).toHaveAttribute('href', '/en-US/about');
  });

  it('does not modify href when skipLocaleHandling is true', () => {
    render(
      <Link href="/about" skipLocaleHandling>
        <span>About Us</span>
      </Link>,
    );

    const link = screen.getByText('About Us').closest('a');
    expect(link).toHaveAttribute('href', '/about');
  });

  it('uses current asPath when href is not provided', () => {
    render(
      <Link>
        <span>Current Path</span>
      </Link>,
    );

    const link = screen.getByText('Current Path').closest('a');
    expect(link).toHaveAttribute('href', '/en-US/current-path');
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

  it('resolves external URLs without locale handling', () => {
    render(
      <Link href="https://example.com">
        <span>External Link</span>
      </Link>,
    );

    const link = screen.getByText('External Link').closest('a');
    expect(link).toHaveAttribute('href', 'https://example.com');
  });

  it('resolves href with locale and skips locale handling for external URLs', () => {
    render(
      <Link href="https://external.com" skipLocaleHandling>
        <span>External Link</span>
      </Link>,
    );

    const link = screen.getByText('External Link').closest('a');
    expect(link).toHaveAttribute('href', 'https://external.com');
  });

  it('resolves the href with locale when skipLocaleHandling is false and the router query is used', () => {
    (useRouter as jest.Mock).mockReturnValue({
      query: { locale: 'fr-FR' },
      asPath: '/about',
      pathname: '/about',
    });

    render(
      <Link href="/about">
        <span>About Us</span>
      </Link>,
    );

    const link = screen.getByText('About Us').closest('a');
    expect(link).toHaveAttribute('href', '/fr-FR/about');
  });
});
