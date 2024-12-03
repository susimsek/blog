import { render, screen, fireEvent } from '@testing-library/react';
import PageSizeSelector from '@/components/pagination/PageSizeSelector';

describe('PageSizeSelector', () => {
  const mockOnSizeChange = jest.fn();

  afterEach(() => {
    mockOnSizeChange.mockClear();
  });

  it('renders with default props', () => {
    const mockOnSizeChange = jest.fn();

    render(<PageSizeSelector size={5} pageSizeOptions={[5, 10, 20]} onSizeChange={mockOnSizeChange} />);

    const selectElement = screen.getByRole('combobox');
    expect(selectElement).toBeInTheDocument();
    expect(selectElement).toHaveValue('5'); // Default size

    const options = screen.getAllByRole('option');
    expect(options).toHaveLength(3); // Default options [5, 10, 20]
    expect(options.map(option => option.textContent)).toEqual(['5', '10', '20']);
  });

  it('renders with custom size and options', () => {
    render(<PageSizeSelector size={10} pageSizeOptions={[10, 25, 50]} onSizeChange={mockOnSizeChange} />);

    const selectElement = screen.getByRole('combobox');
    expect(selectElement).toHaveValue('10');

    const options = screen.getAllByRole('option');
    expect(options).toHaveLength(3); // Custom options [10, 25, 50]
    expect(options.map(option => option.textContent)).toEqual(['10', '25', '50']);
  });

  it('calls onSizeChange when a new option is selected', () => {
    render(<PageSizeSelector size={5} pageSizeOptions={[5, 10, 20]} onSizeChange={mockOnSizeChange} />);

    const selectElement = screen.getByRole('combobox');
    fireEvent.change(selectElement, { target: { value: '10' } });

    expect(mockOnSizeChange).toHaveBeenCalledTimes(1);
    expect(mockOnSizeChange).toHaveBeenCalledWith(10);
  });

  it('applies default styles and classes', () => {
    render(<PageSizeSelector size={5} pageSizeOptions={[5, 10]} onSizeChange={mockOnSizeChange} />);

    const fieldset = screen.getByRole('group');
    expect(fieldset).toHaveClass('d-flex align-items-center');

    const selectElement = screen.getByRole('combobox');
    expect(selectElement).toHaveClass('mb-2');
    expect(selectElement).toHaveStyle('width: 100px');
  });

  it('handles edge case of empty pageSizeOptions', () => {
    render(<PageSizeSelector size={5} pageSizeOptions={[]} onSizeChange={mockOnSizeChange} />);

    const options = screen.queryAllByRole('option');
    expect(options).toHaveLength(0); // No options rendered
  });
});
