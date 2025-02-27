import { render, screen, fireEvent } from '@testing-library/react';
import Paginator from '@/components/pagination/Paginator';

describe('Paginator', () => {
  const mockOnPageChange = jest.fn();

  beforeEach(() => {
    mockOnPageChange.mockClear();
  });

  it('renders pagination items correctly', () => {
    render(<Paginator currentPage={3} totalPages={10} maxPagesToShow={5} onPageChange={mockOnPageChange} />);
    // For currentPage=3, totalPages=10 and maxPagesToShow=5,
    // our algorithm produces page items: [1, 2, 3, 4, 5, "ellipsis", 10]
    // Navigation buttons: First, Prev, Next, Last → toplamda 7 + 4 = 11 button
    const buttons = screen.getAllByRole('button');
    expect(buttons).toHaveLength(9);
  });

  it('disables "First" and "Previous" buttons on the first page', () => {
    render(<Paginator currentPage={1} totalPages={10} maxPagesToShow={5} onPageChange={mockOnPageChange} />);
    const firstButton = screen.getByText(/«/).closest('li');
    const prevButton = screen.getByText(/‹/).closest('li');

    expect(firstButton).toHaveClass('disabled');
    expect(prevButton).toHaveClass('disabled');
  });

  it('disables "Next" and "Last" buttons on the last page', () => {
    render(<Paginator currentPage={10} totalPages={10} maxPagesToShow={5} onPageChange={mockOnPageChange} />);
    const nextButton = screen.getByText(/›/).closest('li');
    const lastButton = screen.getByText(/»/).closest('li');

    expect(nextButton).toHaveClass('disabled');
    expect(lastButton).toHaveClass('disabled');
  });

  it('calls onPageChange when a page is clicked', () => {
    render(<Paginator currentPage={3} totalPages={10} maxPagesToShow={5} onPageChange={mockOnPageChange} />);
    const pageItem = screen.getByText('4');
    fireEvent.click(pageItem);
    expect(mockOnPageChange).toHaveBeenCalledWith(4);
  });

  it('handles ellipsis and boundary pages correctly', () => {
    render(<Paginator currentPage={5} totalPages={10} maxPagesToShow={5} onPageChange={mockOnPageChange} />);
    // For currentPage=5, pages should be: [1, "ellipsis", 4, 5, 6, "ellipsis", 10]
    expect(screen.getByText('4')).toBeInTheDocument();
    expect(screen.getByText('6')).toBeInTheDocument();
    // Eğer Pagination.Ellipsis render edilirse, genellikle "…" simgesi gösterir.
    expect(screen.getAllByText('…').length).toBeGreaterThanOrEqual(1);
  });

  it('uses custom className if provided', () => {
    const customClass = 'custom-pagination-class';
    render(
      <Paginator
        currentPage={3}
        totalPages={10}
        maxPagesToShow={5}
        onPageChange={mockOnPageChange}
        className={customClass}
      />,
    );
    const pagination = screen.getByRole('list');
    expect(pagination).toHaveClass(customClass);
  });

  it('renders only navigation buttons when totalPages is 1', () => {
    render(<Paginator currentPage={1} totalPages={1} onPageChange={mockOnPageChange} />);
    const listItems = screen.getAllByRole('listitem');
    expect(listItems).toHaveLength(5);

    const firstButton = screen.getByText(/«/);
    const prevButton = screen.getByText(/‹/);
    const nextButton = screen.getByText(/›/);
    const lastButton = screen.getByText(/»/);

    expect(firstButton.closest('li')).toHaveClass('disabled');
    expect(prevButton.closest('li')).toHaveClass('disabled');
    expect(nextButton.closest('li')).toHaveClass('disabled');
    expect(lastButton.closest('li')).toHaveClass('disabled');
  });

  it('handles maxPagesToShow correctly when totalPages is less than maxPagesToShow', () => {
    render(<Paginator currentPage={1} totalPages={3} maxPagesToShow={5} onPageChange={mockOnPageChange} />);
    // Since totalPages (3) <= maxPagesToShow (5), pages: [1,2,3] + 4 navigation items = 7 items
    const listItems = screen.getAllByRole('listitem');
    expect(listItems).toHaveLength(7);

    expect(listItems[0]).toHaveTextContent('«'); // First
    expect(listItems[1]).toHaveTextContent('‹'); // Prev
    expect(listItems[2]).toHaveTextContent('1'); // Page 1
    expect(listItems[3]).toHaveTextContent('2'); // Page 2
    expect(listItems[4]).toHaveTextContent('3'); // Page 3
    expect(listItems[5]).toHaveTextContent('›'); // Next
    expect(listItems[6]).toHaveTextContent('»'); // Last
  });

  it('disables "First" and "Previous" buttons when on the first page (using text query)', () => {
    render(<Paginator currentPage={1} totalPages={5} maxPagesToShow={5} onPageChange={mockOnPageChange} />);
    const firstButton = screen.getByText(/First/i, { includeHidden: true }).closest('li');
    expect(firstButton).toBeInTheDocument();
    expect(firstButton).toHaveClass('disabled');

    const previousButton = screen.getByText(/Previous/i, { includeHidden: true }).closest('li');
    expect(previousButton).toBeInTheDocument();
    expect(previousButton).toHaveClass('disabled');
  });

  it('enables "First" and "Previous" buttons when not on the first page', () => {
    render(<Paginator currentPage={3} totalPages={5} maxPagesToShow={5} onPageChange={mockOnPageChange} />);
    expect(screen.getByRole('button', { name: /first/i })).toBeEnabled();
    expect(screen.getByRole('button', { name: /previous/i })).toBeEnabled();
  });

  it('shows the first middle page button correctly when startPage > 2', () => {
    render(<Paginator currentPage={5} totalPages={10} maxPagesToShow={5} onPageChange={mockOnPageChange} />);
    // For currentPage=5, pages: [1, "ellipsis", 4,5,6, "ellipsis", 10]
    const pageButton = screen.getByText('4');
    expect(pageButton).toBeInTheDocument();
    fireEvent.click(pageButton);
    expect(mockOnPageChange).toHaveBeenCalledWith(4);
  });

  it('does not show ellipsis when pages are contiguous', () => {
    render(<Paginator currentPage={1} totalPages={5} maxPagesToShow={5} onPageChange={mockOnPageChange} />);
    // For totalPages=5 and currentPage=1, pages: [1,2,3,4,5] → no ellipsis
    expect(screen.queryByText('…')).not.toBeInTheDocument();
  });

  it('calls onPageChange with 1 when "First" button is clicked', () => {
    render(<Paginator currentPage={3} totalPages={5} maxPagesToShow={5} onPageChange={mockOnPageChange} />);
    const firstButton = screen.getByRole('button', { name: /first/i });
    fireEvent.click(firstButton);
    expect(mockOnPageChange).toHaveBeenCalledWith(1);
  });

  it('calls onPageChange with currentPage - 1 when "Previous" button is clicked', () => {
    render(<Paginator currentPage={3} totalPages={5} maxPagesToShow={5} onPageChange={mockOnPageChange} />);
    const previousButton = screen.getByRole('button', { name: /previous/i });
    fireEvent.click(previousButton);
    expect(mockOnPageChange).toHaveBeenCalledWith(2);
  });

  it('renders as disabled when on the last page', () => {
    render(<Paginator currentPage={5} totalPages={5} maxPagesToShow={5} onPageChange={mockOnPageChange} />);
    const lastButton = screen.getByText(/Last/i, { includeHidden: true }).closest('li');
    expect(lastButton).toBeInTheDocument();
    expect(lastButton).toHaveClass('disabled');
  });

  it('renders as enabled when not on the last page', () => {
    render(<Paginator currentPage={3} totalPages={5} maxPagesToShow={5} onPageChange={mockOnPageChange} />);
    const lastButton = screen.getByRole('button', { name: /last/i });
    expect(lastButton).toBeEnabled();
  });

  it('calls onPageChange with the last page number when clicked', () => {
    render(<Paginator currentPage={3} totalPages={5} maxPagesToShow={5} onPageChange={mockOnPageChange} />);
    const lastButton = screen.getByRole('button', { name: /last/i });
    fireEvent.click(lastButton);
    expect(mockOnPageChange).toHaveBeenCalledTimes(1);
    expect(mockOnPageChange).toHaveBeenCalledWith(5);
  });

  it('disables all navigation buttons when totalPages is 1', () => {
    render(<Paginator currentPage={1} totalPages={1} maxPagesToShow={5} onPageChange={mockOnPageChange} />);
    const listItems = screen.getAllByRole('listitem');
    const disabledButtons = listItems.filter(item => item.classList.contains('disabled'));
    expect(disabledButtons).toHaveLength(4);
    expect(disabledButtons[0]).toHaveTextContent('«'); // First
    expect(disabledButtons[1]).toHaveTextContent('‹'); // Prev
    expect(disabledButtons[2]).toHaveTextContent('›'); // Next
    expect(disabledButtons[3]).toHaveTextContent('»'); // Last
  });

  it('does not call onPageChange when clicking disabled navigation buttons', () => {
    render(<Paginator currentPage={1} totalPages={5} maxPagesToShow={5} onPageChange={mockOnPageChange} />);
    const firstButton = screen.getByText(/First/i, { includeHidden: true }).closest('li');
    fireEvent.click(firstButton!);
    expect(mockOnPageChange).not.toHaveBeenCalled();

    const prevButton = screen.getByText(/Previous/i, { includeHidden: true }).closest('li');
    fireEvent.click(prevButton!);
    expect(mockOnPageChange).not.toHaveBeenCalled();
  });
});
