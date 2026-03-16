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

  it('marks the active density button for editorial and grid layouts', () => {
    const { rerender } = render(<PostDensityToggle value="editorial" onChange={jest.fn()} />);

    expect(screen.getByRole('button', { name: 'common.viewDensity.editorial' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    expect(screen.getByRole('button', { name: 'common.viewDensity.default' })).toHaveAttribute('aria-pressed', 'false');

    rerender(<PostDensityToggle value="grid" onChange={jest.fn()} />);

    expect(screen.getByRole('button', { name: 'common.viewDensity.grid' })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('button', { name: 'common.viewDensity.grid' })).toHaveClass('post-density-toggle-grid-btn');
  });

  it('allows switching back to the default density mode', () => {
    const onChange = jest.fn();
    render(<PostDensityToggle value="grid" onChange={onChange} />);

    fireEvent.click(screen.getByRole('button', { name: 'common.viewDensity.default' }));

    expect(onChange).toHaveBeenCalledWith('default');
  });
});
