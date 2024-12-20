import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { SortDropdown } from '@/components/common/SortDropdown';

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
