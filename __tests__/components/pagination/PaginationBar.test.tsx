import { render, screen, fireEvent } from '@testing-library/react';
import PaginationBar from '@/components/pagination/PaginationBar';

// Mocking useTranslation
jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, options?: Record<string, any>) => {
      if (key === 'common.pagination.showingResults') {
        const { start, end, total } = options || {};
        return `Showing ${start}-${end} of ${total} results`;
      }
      return key;
    },
  }),
}));

describe('PaginationBar', () => {
  const mockOnPageChange = jest.fn();
  const mockOnSizeChange = jest.fn();

  const defaultProps = {
    currentPage: 1,
    totalPages: 10,
    totalResults: 100,
    size: 10,
    onPageChange: mockOnPageChange,
    onSizeChange: mockOnSizeChange,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders the paginator component', () => {
    render(<PaginationBar {...defaultProps} />);

    const paginator = screen.getByRole('list');
    expect(paginator).toBeInTheDocument();
  });

  it('renders the results info text correctly', () => {
    render(<PaginationBar {...defaultProps} />);

    const resultsInfo = screen.getByText('Showing 1-10 of 100 results');
    expect(resultsInfo).toBeInTheDocument();
  });

  it('renders the page size selector component', () => {
    render(<PaginationBar {...defaultProps} />);

    const pageSizeSelector = screen.getByRole('combobox');
    expect(pageSizeSelector).toBeInTheDocument();
  });

  it('calls onPageChange when a page is clicked in the paginator', () => {
    render(<PaginationBar {...defaultProps} />);

    // Simulating clicking on the next page
    const nextButton = screen.getByRole('button', { name: 'Next' });
    fireEvent.click(nextButton);

    expect(mockOnPageChange).toHaveBeenCalledWith(2); // Assuming 2 is the next page
  });

  it('calls onSizeChange when page size is changed', () => {
    render(<PaginationBar {...defaultProps} />);

    const pageSizeSelector = screen.getByRole('combobox');
    fireEvent.change(pageSizeSelector, { target: { value: 20 } });

    expect(mockOnSizeChange).toHaveBeenCalledWith(20);
  });

  it('handles custom pageSizeOptions correctly', () => {
    const customProps = { ...defaultProps, pageSizeOptions: [5, 15, 25] };
    render(<PaginationBar {...customProps} />);

    const options = screen.getAllByRole('option');
    expect(options.map(option => option.textContent)).toEqual(['5', '15', '25']);
  });

  it('displays correct results range when on a middle page', () => {
    render(<PaginationBar {...defaultProps} currentPage={5} size={10} />);

    const resultsInfo = screen.getByText('Showing 41-50 of 100 results');
    expect(resultsInfo).toBeInTheDocument();
  });

  it('displays correct results range when on the last page', () => {
    render(<PaginationBar {...defaultProps} currentPage={10} size={10} />);

    const resultsInfo = screen.getByText('Showing 91-100 of 100 results');
    expect(resultsInfo).toBeInTheDocument();
  });

  it('displays correct results range when results are less than a page size', () => {
    render(<PaginationBar {...defaultProps} currentPage={1} size={10} totalResults={7} />);

    const resultsInfo = screen.getByText('Showing 1-7 of 7 results');
    expect(resultsInfo).toBeInTheDocument();
  });
});
