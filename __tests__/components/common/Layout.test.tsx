import { fireEvent, screen } from '@testing-library/react';
import Layout from '@/components/common/Layout';
import { renderWithProviders } from '@tests/utils/renderWithProviders';
import { useRouter } from 'next/router';
import useMediaQuery from '@/hooks/useMediaQuery';

jest.mock('next/router', () => ({
  useRouter: jest.fn(),
}));

jest.mock('@/hooks/useMediaQuery', () => ({
  __esModule: true,
  default: jest.fn(),
}));

jest.mock('@/components/common/Header', () => ({
  __esModule: true,
  default: ({ onSidebarToggle }: { onSidebarToggle: () => void }) => (
    <header data-testid="header">
      <button onClick={onSidebarToggle}>toggle-sidebar</button>
    </header>
  ),
}));

jest.mock('@/components/common/Footer', () => ({
  __esModule: true,
  default: () => <footer data-testid="footer">Footer</footer>,
}));

jest.mock('@/components/common/Sidebar', () => ({
  __esModule: true,
  default: ({ isVisible }: { isVisible: boolean }) => <aside data-testid="sidebar">{String(isVisible)}</aside>,
}));

jest.mock('@/components/common/PreFooter', () => ({
  __esModule: true,
  default: () => <div data-testid="pre-footer" />,
}));

jest.mock('@next/third-parties/google', () => ({
  __esModule: true,
  GoogleAnalytics: () => <div data-testid="google-analytics">Google Analytics</div>,
}));

describe('Layout Component', () => {
  const observe = jest.fn();
  const unobserve = jest.fn();
  let intersectionCallback: ((entries: Array<{ isIntersecting: boolean }>) => void) | undefined;

  beforeEach(() => {
    (useRouter as jest.Mock).mockReturnValue({
      locale: 'en',
      defaultLocale: 'en',
      pathname: '/',
      query: {},
      push: jest.fn(),
    });
    (useMediaQuery as jest.Mock).mockReturnValue(false);
    document.body.className = '';
    observe.mockClear();
    unobserve.mockClear();
    Object.defineProperty(globalThis, 'IntersectionObserver', {
      writable: true,
      value: jest.fn((cb: (entries: Array<{ isIntersecting: boolean }>) => void) => {
        intersectionCallback = cb;
        return { observe, unobserve };
      }),
    });
  });

  it('renders layout skeleton with children', () => {
    renderWithProviders(
      <Layout>
        <div data-testid="child">Content</div>
      </Layout>,
    );

    expect(screen.getByTestId('header')).toBeInTheDocument();
    expect(screen.getByTestId('footer')).toBeInTheDocument();
    expect(screen.getByTestId('pre-footer')).toBeInTheDocument();
    expect(screen.getByTestId('child')).toBeInTheDocument();
  });

  it('shows sidebar on desktop when enabled', () => {
    renderWithProviders(
      <Layout sidebarEnabled topics={[]}>
        <div>Content</div>
      </Layout>,
    );

    expect(screen.getByTestId('sidebar')).toBeInTheDocument();
    expect(screen.getByText('true')).toBeInTheDocument();
  });

  it('hides sidebar on mobile', () => {
    (useMediaQuery as jest.Mock).mockReturnValue(true);

    renderWithProviders(
      <Layout sidebarEnabled topics={[]}>
        <div>Content</div>
      </Layout>,
    );

    expect(screen.queryByTestId('sidebar')).not.toBeInTheDocument();
  });

  it('toggles sidebar visibility from header action', () => {
    renderWithProviders(
      <Layout sidebarEnabled topics={[]}>
        <div>Content</div>
      </Layout>,
    );

    expect(screen.getByTestId('sidebar')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /toggle-sidebar/i }));
    expect(screen.queryByTestId('sidebar')).not.toBeInTheDocument();
  });

  it('handles footer intersection updates and unobserve on unmount', () => {
    const { unmount } = renderWithProviders(
      <Layout>
        <div>Content</div>
      </Layout>,
    );

    expect(observe).toHaveBeenCalled();
    intersectionCallback?.([{ isIntersecting: true }]);
    expect(document.body.classList.contains('footer-visible')).toBe(true);

    intersectionCallback?.([{ isIntersecting: false }]);
    expect(document.body.classList.contains('footer-visible')).toBe(false);

    unmount();
    expect(unobserve).toHaveBeenCalled();
  });
});
