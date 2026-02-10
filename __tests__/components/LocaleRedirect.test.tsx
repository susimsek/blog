import React from 'react';
import { render } from '@testing-library/react';
import { useRedirect, Redirect, getRedirect } from '@/components/LocaleRedirect';
import languageDetector from '@/lib/languageDetector';

const replaceMock = jest.fn();
const useRouterMock = jest.fn();
const usePathnameMock = jest.fn();
const useSearchParamsMock = jest.fn();

jest.mock('next/navigation', () => ({
  useRouter: () => useRouterMock(),
  usePathname: () => usePathnameMock(),
  useSearchParams: () => useSearchParamsMock(),
}));

jest.mock('@/lib/languageDetector', () => ({
  detect: jest.fn(),
  cache: jest.fn(),
}));

jest.mock('@/components/common/Loading', () => () => <div data-testid="loading-spinner">Loading...</div>);

describe('LocaleRedirect/useRedirect', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    useRouterMock.mockReturnValue({ replace: replaceMock });
    usePathnameMock.mockReturnValue('/404');
    useSearchParamsMock.mockReturnValue(new URLSearchParams());
  });

  const TestComponent = ({ to }: { to?: string }) => {
    useRedirect(to);
    return <div data-testid="test-component">Redirecting...</div>;
  };

  it('detects language and redirects correctly for 404 route', () => {
    (languageDetector.detect as jest.Mock).mockReturnValue('en');

    render(<Redirect />);

    expect(languageDetector.detect).toHaveBeenCalled();
    expect(replaceMock).toHaveBeenCalledWith('/en/404');
    expect(languageDetector.cache).toHaveBeenCalledWith('en');
  });

  it('redirects to the specified path with detected language', () => {
    (languageDetector.detect as jest.Mock).mockReturnValue('es');

    render(<TestComponent to="/custom-path" />);

    expect(languageDetector.detect).toHaveBeenCalled();
    expect(replaceMock).toHaveBeenCalledWith('/en/custom-path');
    expect(languageDetector.cache).toHaveBeenCalledWith('en');
  });

  it('does not cache language if languageDetector.cache is undefined', () => {
    (languageDetector.detect as jest.Mock).mockReturnValue('fr');

    const originalCache = languageDetector.cache;
    languageDetector.cache = undefined;

    render(<TestComponent to="/another-path" />);

    expect(languageDetector.detect).toHaveBeenCalled();
    expect(replaceMock).toHaveBeenCalledWith('/en/another-path');
    if (languageDetector.cache) {
      expect(languageDetector.cache).not.toHaveBeenCalled();
    }

    languageDetector.cache = originalCache;
  });

  it('handles non-404 paths without language prefix', () => {
    (languageDetector.detect as jest.Mock).mockReturnValue('de');
    usePathnameMock.mockReturnValue('/unknown');

    render(<Redirect />);

    expect(languageDetector.detect).toHaveBeenCalled();
    expect(replaceMock).toHaveBeenCalledWith('/en/unknown');
  });

  it('keeps localized target when target already has supported locale prefix', () => {
    (languageDetector.detect as jest.Mock).mockReturnValue('fr');
    usePathnameMock.mockReturnValue('/404');

    render(<TestComponent to="/tr/404" />);

    expect(languageDetector.detect).toHaveBeenCalled();
    expect(replaceMock).toHaveBeenCalledWith('/tr/404');
  });

  it('strips basePath from pathname before locale redirecting', () => {
    (languageDetector.detect as jest.Mock).mockReturnValue('en');
    usePathnameMock.mockReturnValue('/blog/404');
    process.env.NEXT_PUBLIC_BASE_PATH = '/blog';

    render(<Redirect />);

    expect(replaceMock).toHaveBeenCalledWith('/en/404');
    delete process.env.NEXT_PUBLIC_BASE_PATH;
  });
});

describe('LocaleRedirect/getRedirect', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    useRouterMock.mockReturnValue({ replace: replaceMock });
    usePathnameMock.mockReturnValue('/404');
    useSearchParamsMock.mockReturnValue(new URLSearchParams());
  });

  it('returns a component that redirects to the specified path', () => {
    (languageDetector.detect as jest.Mock).mockReturnValue('en');

    const RedirectComponent = getRedirect('/specific-path');
    const { getByTestId } = render(<RedirectComponent />);

    expect(languageDetector.detect).toHaveBeenCalled();
    expect(replaceMock).toHaveBeenCalledWith('/en/specific-path');
    expect(languageDetector.cache).toHaveBeenCalledWith('en');
    expect(getByTestId('loading-spinner')).toBeInTheDocument();
  });
});
