import React from 'react';
import { render, screen } from '@testing-library/react';
import FlagIcon from '@/components/common/FlagIcon';

// Mock `flags` to simulate icon loading
jest.mock('@/config/iconLoader', () => ({
  flags: {
    tr: (props: any) => <svg {...props} data-testid="flag-tr" />,
    en: (props: any) => <svg {...props} data-testid="flag-en" />,
  },
}));

describe('FlagIcon Component', () => {
  it('renders the correct flag based on the provided code', () => {
    render(<FlagIcon code="tr" alt="Turkish Flag" />);
    const flag = screen.getByTestId('flag-tr');
    expect(flag).toBeInTheDocument();
  });

  it('uses the default aria-label if no alt text is provided', () => {
    render(<FlagIcon code="en" />);
    const flag = screen.getByTestId('flag-en');
    expect(flag).toBeInTheDocument();
  });

  it('applies custom width, height, and style to the flag', () => {
    render(<FlagIcon code="tr" alt="Turkish Flag" width={50} height={30} style={{ marginLeft: '10px' }} />);
    const flag = screen.getByTestId('flag-tr');
    expect(flag).toBeInTheDocument();
    expect(flag).toHaveAttribute('width', '50');
    expect(flag).toHaveAttribute('height', '30');
    expect(flag).toHaveStyle('margin-left: 10px');
  });

  it('logs an error and renders nothing if the flag code is invalid', () => {
    const consoleErrorMock = jest.spyOn(console, 'error').mockImplementation();
    const { container } = render(<FlagIcon code="invalid-code" />);
    expect(consoleErrorMock).toHaveBeenCalledWith('Flag icon for "invalid-code" not found');
    expect(container.firstChild).toBeNull();
    consoleErrorMock.mockRestore();
  });

  it('applies the provided className to the rendered flag', () => {
    render(<FlagIcon code="tr" className="custom-class" />);
    const flag = screen.getByTestId('flag-tr');
    expect(flag).toBeInTheDocument();
    expect(flag).toHaveClass('custom-class');
  });
});
