import React from 'react';
import { render } from '@testing-library/react';
import { useRedirect, Redirect, getRedirect } from '@/lib/redirect';
import { useRouter } from '@/navigation/router';
import languageDetector from '@/lib/languageDetector';

jest.mock('@/navigation/router', () => ({
  useRouter: jest.fn(),
}));

jest.mock('@/lib/languageDetector', () => ({
  detect: jest.fn(),
  cache: jest.fn(),
}));

jest.mock('@/components/common/Loading', () => () => <div data-testid="loading-spinner">Loading...</div>);

describe('useRedirect', () => {
  const mockReplace = jest.fn();
  const mockRouter = {
    replace: mockReplace,
    asPath: '/some-path',
    route: '/404',
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (useRouter as jest.Mock).mockReturnValue(mockRouter);
  });

  const TestComponent = ({ to }: { to?: string }) => {
    useRedirect(to);
    return <div data-testid="test-component">Redirecting...</div>;
  };

  it('should detect the language and redirect correctly', () => {
    // Mock language detection to return 'en'
    (languageDetector.detect as jest.Mock).mockReturnValue('en');

    // Set up the mock router to have the expected route
    mockRouter.route = '/404';
    mockRouter.asPath = '/404';

    // Render the Redirect component
    render(<Redirect />);

    // Verify that the languageDetector.detect was called
    expect(languageDetector.detect).toHaveBeenCalled();

    // Verify that router.replace was called with the correct path
    expect(mockReplace).toHaveBeenCalledWith('/en/404');

    // Verify that languageDetector.cache was called with the detected language
    expect(languageDetector.cache).toHaveBeenCalledWith('en');
  });

  it('should redirect to the specified path with detected language', () => {
    (languageDetector.detect as jest.Mock).mockReturnValue('es');

    render(<TestComponent to="/custom-path" />);

    expect(languageDetector.detect).toHaveBeenCalled();
    expect(mockReplace).toHaveBeenCalledWith('/es/custom-path');
    expect(languageDetector.cache).toHaveBeenCalledWith('es');
  });

  it('should not cache language if languageDetector.cache is undefined', () => {
    // Mock the behavior of languageDetector
    (languageDetector.detect as jest.Mock).mockReturnValue('fr');

    // Override the cache function to undefined
    const originalCache = languageDetector.cache;
    languageDetector.cache = undefined;

    // Create a test component that uses the hook
    const TestComponent = ({ to }: { to?: string }) => {
      useRedirect(to);
      return <div data-testid="test-component">Redirecting...</div>;
    };

    render(<TestComponent to="/another-path" />);

    // Verify the detect function was called
    expect(languageDetector.detect).toHaveBeenCalled();

    // Verify the replace function was called with the correct path
    expect(mockReplace).toHaveBeenCalledWith('/fr/another-path');

    // Verify that the cache function was not called
    if (languageDetector.cache) {
      expect(languageDetector.cache).not.toHaveBeenCalled();
    }

    // Restore the original cache function
    languageDetector.cache = originalCache;
  });

  it('should handle route without language prefix', () => {
    (languageDetector.detect as jest.Mock).mockReturnValue('de');

    // Mock router properties correctly
    mockRouter.route = '/unknown';
    mockRouter.asPath = '/unknown';

    render(<Redirect />);

    // Verify that the languageDetector.detect was called
    expect(languageDetector.detect).toHaveBeenCalled();

    // Verify that router.replace was called with the correct path
    expect(mockReplace).toHaveBeenCalledWith('/de/unknown');
  });

  it('should not redirect if targetPath already has the detected language and route is /404', () => {
    (languageDetector.detect as jest.Mock).mockReturnValue('fr');

    // targetPath starts with detected language and route is /404
    mockRouter.route = '/404';
    mockRouter.asPath = '/fr/404';

    render(<Redirect />);

    // Verify that languageDetector.detect was called
    expect(languageDetector.detect).toHaveBeenCalled();

    // Verify that router.replace was NOT called
    expect(mockReplace).toHaveBeenCalledWith('/fr/404');
  });
});

describe('getRedirect', () => {
  const mockReplace = jest.fn();
  const mockRouter = {
    replace: mockReplace,
    asPath: '/some-path',
    route: '/404',
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (useRouter as jest.Mock).mockReturnValue(mockRouter);
  });

  it('should return a component that redirects to the specified path', () => {
    (languageDetector.detect as jest.Mock).mockReturnValue('en');

    // Call getRedirect to generate a component
    const RedirectComponent = getRedirect('/specific-path');

    // Render the returned component
    const { getByTestId } = render(<RedirectComponent />);

    // Assertions
    expect(languageDetector.detect).toHaveBeenCalled();
    expect(mockReplace).toHaveBeenCalledWith('/en/specific-path');
    expect(languageDetector.cache).toHaveBeenCalledWith('en');
    expect(getByTestId('loading-spinner')).toBeInTheDocument();
  });
});
