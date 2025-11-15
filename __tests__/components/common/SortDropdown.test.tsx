import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { SortDropdown } from '@/components/common/SortDropdown';

jest.mock('@fortawesome/react-fontawesome', () => ({
  FontAwesomeIcon: () => <span data-testid="fa-icon" />,
}));

jest.mock('react-bootstrap', () => {
  const React = require('react');

  const DropdownContext = React.createContext<{ onSelect?: (eventKey: string) => void }>({});

  const DropdownButton = ({
    children,
    onSelect,
  }: {
    children: React.ReactNode;
    onSelect?: (eventKey: string | null) => void;
  }) => (
    <div data-testid="dropdown-button">
      <DropdownContext.Provider value={{ onSelect: onSelect as (eventKey: string) => void }}>
        {children}
      </DropdownContext.Provider>
    </div>
  );

  const DropdownItem = ({ children, eventKey }: { children: React.ReactNode; eventKey: string }) => {
    const ctx = React.useContext(DropdownContext);
    return (
      <button type="button" onClick={() => ctx.onSelect?.(eventKey)}>
        {children}
      </button>
    );
  };

  const DropdownDivider = () => <hr />;

  return {
    DropdownButton,
    Dropdown: {
      Item: DropdownItem,
      Divider: DropdownDivider,
    },
  };
});

jest.mock('next-i18next', () => ({
  useTranslation: jest.fn().mockReturnValue({
    t: (key: string) => key,
  }),
}));

describe('SortDropdown', () => {
  const onChangeMock = jest.fn();

  const renderComponent = (sortOrder: 'asc' | 'desc') => {
    render(<SortDropdown sortOrder={sortOrder} onChange={onChangeMock} />);
  };

  test('renders correctly with "asc" order', () => {
    renderComponent('asc');

    expect(screen.getByText('common.sort.oldest')).toBeInTheDocument();
  });

  test('renders correctly with "desc" order', () => {
    renderComponent('desc');

    expect(screen.getByText('common.sort.newest')).toBeInTheDocument();
  });

  test('calls onChange with "desc" when selected', () => {
    renderComponent('asc');

    fireEvent.click(screen.getByText('common.sort.oldest'));
    fireEvent.click(screen.getByText('common.sort.newest'));

    expect(onChangeMock).toHaveBeenCalledWith('desc');
  });

  test('calls onChange with "asc" when selected', () => {
    renderComponent('desc');

    fireEvent.click(screen.getByText('common.sort.newest'));
    fireEvent.click(screen.getByText('common.sort.oldest'));

    expect(onChangeMock).toHaveBeenCalledWith('asc');
  });
});
