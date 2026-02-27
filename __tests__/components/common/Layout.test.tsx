import { fireEvent, screen } from '@testing-library/react';
import { renderWithProviders } from '@tests/utils/renderWithProviders';
import useMediaQuery from '@/hooks/useMediaQuery';
import { registerDynamicMock } from '@tests/utils/dynamicMockRegistry';

type LayoutComponent = typeof import('@/components/common/Layout').default;
let Layout: LayoutComponent;

const useParamsMock = jest.fn();
const usePathnameMock = jest.fn();

jest.mock('next/navigation', () => ({
  useParams: () => useParamsMock(),
  usePathname: () => usePathnameMock(),
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
  default: ({
    isVisible,
    isMobile,
    isLoading,
    topics,
    onClose,
  }: {
    isVisible: boolean;
    isMobile?: boolean;
    isLoading?: boolean;
    topics?: Array<{ id: string }>;
    onClose?: () => void;
  }) => (
    <aside
      data-testid="sidebar"
      data-visible={String(isVisible)}
      data-mobile={String(Boolean(isMobile))}
      data-loading={String(Boolean(isLoading))}
      data-topic-ids={(topics ?? []).map(topic => topic.id).join(',')}
    >
      {String(isVisible)}
      <button type="button" onClick={onClose}>
        close-sidebar
      </button>
    </aside>
  ),
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

  beforeAll(() => {
    const sidebar = jest.requireMock('@/components/common/Sidebar');
    registerDynamicMock('Sidebar', sidebar);
    registerDynamicMock('@/components/common/Sidebar', sidebar);
    Layout = require('@/components/common/Layout').default;
  });

  beforeEach(() => {
    useParamsMock.mockReturnValue({ locale: 'en' });
    usePathnameMock.mockReturnValue('/en');
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
    expect(screen.getByTestId('sidebar')).toHaveAttribute('data-mobile', 'false');
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

  it('opens and closes mobile sidebar via header toggle and sidebar close action', () => {
    (useMediaQuery as jest.Mock).mockReturnValue(true);

    renderWithProviders(
      <Layout sidebarEnabled topics={[]}>
        <div>Content</div>
      </Layout>,
    );

    expect(screen.queryByTestId('sidebar')).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /toggle-sidebar/i }));
    const mobileSidebar = screen.getByTestId('sidebar');
    expect(mobileSidebar).toHaveAttribute('data-mobile', 'true');
    expect(mobileSidebar).toHaveAttribute('data-visible', 'true');

    fireEvent.click(screen.getByRole('button', { name: /close-sidebar/i }));
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

  it('normalizes topics in initializer and stores route locale', () => {
    const { store } = renderWithProviders(
      <Layout
        topics={
          [
            null,
            { id: 'missing-color', name: 'Missing Color' },
            { id: 'react', name: 'React', color: 'red', link: '/topics/react' },
          ] as unknown as Array<{ id: string; name: string; color: string; link?: string }>
        }
      >
        <div>Content</div>
      </Layout>,
    );

    const state = store.getState().postsQuery;
    expect(state.locale).toBe('en');
    expect(state.topicsLoading).toBe(false);
    expect(state.topics).toEqual([{ id: 'react', name: 'React', color: 'red', link: '/topics/react' }]);
  });

  it('closes desktop sidebar via sidebar onClose action', () => {
    renderWithProviders(
      <Layout sidebarEnabled topics={[]}>
        <div>Content</div>
      </Layout>,
    );

    expect(screen.getByTestId('sidebar')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /close-sidebar/i }));
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
