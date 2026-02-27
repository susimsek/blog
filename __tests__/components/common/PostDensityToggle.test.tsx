import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import PostDensityToggle from '@/components/common/PostDensityToggle';

jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

jest.mock('@fortawesome/react-fontawesome', () => ({
  FontAwesomeIcon: ({ icon, className }: { icon: string; className?: string }) => (
    <span data-testid={`icon-${icon}`} className={className} />
  ),
}));

describe('PostDensityToggle', () => {
  it('renders icons with fixed-width class and changes mode on click', () => {
    const onChange = jest.fn();
    render(<PostDensityToggle value="default" onChange={onChange} />);

    expect(screen.getByTestId('icon-desktop')).toHaveClass('fa-fw');
    expect(screen.getByTestId('icon-clipboard-list')).toHaveClass('fa-fw');
    expect(screen.getByTestId('icon-table-cells')).toHaveClass('fa-fw');

    fireEvent.click(screen.getByRole('button', { name: 'common.viewDensity.editorial' }));
    expect(onChange).toHaveBeenCalledWith('editorial');
  });
});
