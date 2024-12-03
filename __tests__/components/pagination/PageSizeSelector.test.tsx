import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import PageSizeSelector from '@/components/pagination/PageSizeSelector';

describe('PageSizeSelector', () => {
  const mockOnSizeChange = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders the component with default values', () => {
    render(<PageSizeSelector size={5} pageSizeOptions={[5, 10, 20]} onSizeChange={mockOnSizeChange} />);

    // Check for label
    expect(screen.getByText('Page size:')).toBeInTheDocument();

    // Check for select input with default value
    const selectElement = screen.getByRole('combobox');
    expect(selectElement).toBeInTheDocument();
    expect(selectElement).toHaveValue('5');

    // Check for all options
    const options = screen.getAllByRole('option');
    expect(options).toHaveLength(3);
    expect(options[0]).toHaveValue('5');
    expect(options[0]).toHaveTextContent('5');
    expect(options[1]).toHaveValue('10');
    expect(options[1]).toHaveTextContent('10');
    expect(options[2]).toHaveValue('20');
    expect(options[2]).toHaveTextContent('20');
  });

  it('renders with custom page size and options', () => {
    render(<PageSizeSelector size={10} pageSizeOptions={[10, 25, 50]} onSizeChange={mockOnSizeChange} />);

    const selectElement = screen.getByRole('combobox');
    expect(selectElement).toHaveValue('10');

    const options = screen.getAllByRole('option');
    expect(options).toHaveLength(3);
    expect(options[0]).toHaveValue('10');
    expect(options[0]).toHaveTextContent('10');
    expect(options[1]).toHaveValue('25');
    expect(options[1]).toHaveTextContent('25');
    expect(options[2]).toHaveValue('50');
    expect(options[2]).toHaveTextContent('50');
  });

  it('calls onSizeChange when a new size is selected', () => {
    render(<PageSizeSelector size={5} pageSizeOptions={[5, 10, 20]} onSizeChange={mockOnSizeChange} />);

    const selectElement = screen.getByRole('combobox');
    fireEvent.change(selectElement, { target: { value: '10' } });

    expect(mockOnSizeChange).toHaveBeenCalledTimes(1);
    expect(mockOnSizeChange).toHaveBeenCalledWith(10);
  });

  it('applies custom styles and classes', () => {
    render(<PageSizeSelector size={5} pageSizeOptions={[5, 10]} onSizeChange={mockOnSizeChange} />);

    const fieldset = screen.getByRole('group', { name: /page size selector/i });
    expect(fieldset).toHaveClass('d-flex align-items-center');

    const selectElement = screen.getByRole('combobox');
    expect(selectElement).toHaveClass('mb-2');
    expect(selectElement).toHaveStyle('width: 100px');
  });

  it('handles an empty pageSizeOptions array gracefully', () => {
    render(<PageSizeSelector size={5} pageSizeOptions={[]} onSizeChange={mockOnSizeChange} />);

    const selectElement = screen.getByRole('combobox');
    expect(selectElement).toBeEmptyDOMElement();
  });
});
