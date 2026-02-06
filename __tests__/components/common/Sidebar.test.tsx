import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import Sidebar from '@/components/common/Sidebar';

jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

jest.mock('@fortawesome/react-fontawesome', () => ({
  FontAwesomeIcon: ({ icon }: { icon: string }) => <span data-testid={`icon-${icon}`} />,
}));

jest.mock('@/hooks/useDebounce', () => jest.fn((value: string) => value));

jest.mock('@/components/search/SearchBar', () => ({
  __esModule: true,
  default: ({ query, onChange }: { query: string; onChange: (value: string) => void }) => (
    <input
      data-testid="sidebar-search"
      value={query}
      onChange={event => onChange(event.target.value)}
      placeholder="topic search"
    />
  ),
}));

jest.mock('@/components/common/Link', () => ({
  __esModule: true,
  default: ({ href, children, onClick }: { href: string; children: React.ReactNode; onClick?: () => void }) => (
    <a href={href} onClick={onClick}>
      {children}
    </a>
  ),
}));

jest.mock('@assets/images/logo.svg', () => ({
  __esModule: true,
  default: () => <span data-testid="logo" />,
}));

jest.mock('react-bootstrap/Nav', () => {
  const Nav = ({ children, ...props }: { children: React.ReactNode }) => <nav {...props}>{children}</nav>;
  const NavLink = ({ children, ...props }: { children: React.ReactNode }) => (
    <a data-testid="nav-link" {...props}>
      {children}
    </a>
  );
  Nav.Link = NavLink;
  return Nav;
});

jest.mock('react-bootstrap/Offcanvas', () => {
  const Offcanvas = ({ show, children, onHide }: { show: boolean; children: React.ReactNode; onHide?: () => void }) =>
    show ? (
      <div data-testid="offcanvas">
        <button type="button" onClick={onHide}>
          close
        </button>
        {children}
      </div>
    ) : null;

  Offcanvas.Header = ({ children }: { children: React.ReactNode }) => <div>{children}</div>;
  Offcanvas.Body = ({ children }: { children: React.ReactNode }) => <div>{children}</div>;

  return Offcanvas;
});

describe('Sidebar', () => {
  const topics = [
    { id: 'java', name: 'Java', color: 'red' },
    { id: 'react', name: 'React', color: 'blue' },
  ];

  it('renders filtered topics on desktop', () => {
    render(<Sidebar topics={topics} isMobile={false} isVisible onClose={jest.fn()} />);

    fireEvent.change(screen.getByTestId('sidebar-search'), { target: { value: 'react' } });

    expect(screen.getByText('React')).toBeInTheDocument();
    expect(screen.queryByText('Java')).not.toBeInTheDocument();
  });

  it('shows empty state when no topics match search', () => {
    render(<Sidebar topics={topics} isMobile={false} isVisible onClose={jest.fn()} />);

    fireEvent.change(screen.getByTestId('sidebar-search'), { target: { value: 'python' } });

    expect(screen.getByText('topic:topic.noTopicFound')).toBeInTheDocument();
  });

  it('closes when topic is clicked on mobile', () => {
    const onClose = jest.fn();

    render(<Sidebar topics={topics} isMobile isVisible onClose={onClose} />);

    fireEvent.click(screen.getByText('Java'));

    expect(onClose).toHaveBeenCalled();
    expect(screen.getByTestId('offcanvas')).toBeInTheDocument();
  });
});
