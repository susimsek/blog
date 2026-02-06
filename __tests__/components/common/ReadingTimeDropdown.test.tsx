import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import ReadingTimeDropdown from '@/components/common/ReadingTimeDropdown';
import type { ReadingTimeRange } from '@/reducers/postsQuery';

jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

jest.mock('@fortawesome/react-fontawesome', () => ({
  FontAwesomeIcon: () => <span data-testid="icon-clock" />,
}));

jest.mock('react-bootstrap/DropdownButton', () => {
  const React = require('react');

  const DropdownButton = ({ title, onSelect, children }: any) => (
    <div>
      <div data-testid="reading-time-title">{title}</div>
      {React.Children.map(children, (child: any) =>
        React.cloneElement(child, {
          onSelect,
        }),
      )}
      <button type="button" onClick={() => onSelect?.(undefined)}>
        trigger-empty
      </button>
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

describe('ReadingTimeDropdown', () => {
  it.each([
    ['any', 'common.readingTimeFilter.any'],
    ['3-7', 'common.readingTimeFilter.range3to7'],
    ['8-12', 'common.readingTimeFilter.range8to12'],
    ['15+', 'common.readingTimeFilter.range15plus'],
  ] as const)('renders title for %s', (value, expectedLabel) => {
    render(<ReadingTimeDropdown value={value as ReadingTimeRange} onChange={jest.fn()} />);
    expect(screen.getByTestId('reading-time-title')).toHaveTextContent(expectedLabel);
  });

  it('calls onChange when an option is selected', () => {
    const onChange = jest.fn();
    render(<ReadingTimeDropdown value="any" onChange={onChange} />);

    fireEvent.click(screen.getByText('common.readingTimeFilter.range8to12'));
    expect(onChange).toHaveBeenCalledWith('8-12');
  });

  it('does not call onChange when empty selection is emitted', () => {
    const onChange = jest.fn();
    render(<ReadingTimeDropdown value="any" onChange={onChange} />);

    fireEvent.click(screen.getByText('trigger-empty'));
    expect(onChange).not.toHaveBeenCalled();
  });
});
