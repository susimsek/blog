import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import SourceDropdown from '@/components/common/SourceDropdown';

jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

jest.mock('@fortawesome/react-fontawesome', () => ({
  FontAwesomeIcon: ({ icon }: { icon: string | [string, string] }) => (
    <span data-testid={`icon-${Array.isArray(icon) ? icon.join('-') : icon}`} />
  ),
}));

jest.mock('react-bootstrap/DropdownButton', () => {
  const React = require('react');

  const DropdownButton = ({ title, onSelect, children }: any) => (
    <div>
      <div data-testid="source-title">{title}</div>
      {React.Children.map(children, (child: any) =>
        React.cloneElement(child, {
          onSelect,
        }),
      )}
    </div>
  );

  return DropdownButton;
});

jest.mock('react-bootstrap/Dropdown', () => {
  const DropdownItem = ({ eventKey, onSelect, children }: any) => (
    <button type="button" onClick={() => onSelect?.(eventKey)}>
      {children}
    </button>
  );

  return {
    Item: DropdownItem,
  };
});

describe('SourceDropdown', () => {
  it('renders all source options', () => {
    render(<SourceDropdown value="all" onChange={jest.fn()} />);

    expect(screen.getAllByText('common.sourceFilter.all').length).toBeGreaterThan(0);
    expect(screen.getAllByText('common.sourceFilter.blog').length).toBeGreaterThan(0);
    expect(screen.getAllByText('common.sourceFilter.medium').length).toBeGreaterThan(0);
  });

  it('calls onChange when medium is selected', () => {
    const onChange = jest.fn();
    render(<SourceDropdown value="all" onChange={onChange} />);

    fireEvent.click(screen.getAllByText('common.sourceFilter.medium')[0]);
    expect(onChange).toHaveBeenCalledWith('medium');
  });

  it('shows medium icon in title when medium is selected', () => {
    render(<SourceDropdown value="medium" onChange={jest.fn()} />);

    expect(screen.getAllByTestId('icon-fab-medium').length).toBeGreaterThan(0);
    expect(screen.queryByTestId('icon-link')).not.toBeInTheDocument();
  });

  it('shows the blog title and icon when blog is selected', () => {
    render(<SourceDropdown value="blog" onChange={jest.fn()} />);

    expect(screen.getByTestId('source-title')).toHaveTextContent('common.sourceFilter.blog');
    expect(screen.getAllByTestId('icon-book').length).toBeGreaterThan(0);
  });
});
