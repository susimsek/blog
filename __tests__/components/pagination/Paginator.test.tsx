import { render, screen, fireEvent } from '@testing-library/react';
import Paginator from '@/components/pagination/Paginator';

describe('Paginator', () => {
  const mockOnPageChange = jest.fn();

  beforeEach(() => {
    mockOnPageChange.mockClear();
  });

  it('renders pagination items correctly', () => {
    render(<Paginator currentPage={3} totalPages={10} maxPagesToShow={5} onPageChange={mockOnPageChange} />);

    // Check if the pagination component renders
    expect(screen.getByRole('list')).toBeInTheDocument();

    // Check if the correct pages are rendered
    const pageItems = screen.getAllByRole('button');
    expect(pageItems).toHaveLength(9); // First, Prev, 1, ..., 3, ..., 10, Next, Last
  });

  it('disables "First" and "Previous" buttons on the first page', () => {
    render(<Paginator currentPage={1} totalPages={10} maxPagesToShow={5} onPageChange={mockOnPageChange} />);

    const firstButton = screen.getByText('«').closest('li');
    const prevButton = screen.getByText('‹').closest('li');

    expect(firstButton).toHaveClass('disabled');
    expect(prevButton).toHaveClass('disabled');
  });

  it('disables "Next" and "Last" buttons on the last page', () => {
    render(<Paginator currentPage={10} totalPages={10} maxPagesToShow={5} onPageChange={mockOnPageChange} />);

    const nextButton = screen.getByText('›').closest('li');
    const lastButton = screen.getByText('»').closest('li');

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

    expect(screen.getByText('1')).toBeInTheDocument();
    expect(screen.getByText('10')).toBeInTheDocument();
    expect(screen.getAllByText('…')).toHaveLength(2); // Two ellipsis
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

    const navigationButtons = screen.getAllByRole('listitem');
    const disabledButtons = navigationButtons.filter(button => button.classList.contains('disabled'));

    // Check if the expected buttons are present and disabled
    expect(disabledButtons).toHaveLength(4); // First, Previous, Next, Last

    // Verify text content of each button to ensure they are the expected ones
    const firstButton = screen.getByText('«');
    const previousButton = screen.getByText('‹');
    const nextButton = screen.getByText('›');
    const lastButton = screen.getByText('»');

    expect(firstButton).toBeInTheDocument();
    expect(previousButton).toBeInTheDocument();
    expect(nextButton).toBeInTheDocument();
    expect(lastButton).toBeInTheDocument();
  });

  it('handles maxPagesToShow correctly when totalPages is less than maxPagesToShow', () => {
    render(<Paginator currentPage={1} totalPages={3} maxPagesToShow={5} onPageChange={mockOnPageChange} />);

    // Fetch all the list items within the pagination component
    const pageItems = screen.getAllByRole('listitem');

    // Expect 7 items: First, Prev, 1, 2, 3, Next, Last
    expect(pageItems).toHaveLength(7);

    // Validate the text content for each expected button
    expect(pageItems[0]).toHaveTextContent('«'); // First
    expect(pageItems[1]).toHaveTextContent('‹'); // Prev
    expect(pageItems[2]).toHaveTextContent('1'); // Page 1
    expect(pageItems[3]).toHaveTextContent('2'); // Page 2
    expect(pageItems[4]).toHaveTextContent('3'); // Page 3
    expect(pageItems[5]).toHaveTextContent('›'); // Next
    expect(pageItems[6]).toHaveTextContent('»'); // Last
  });

  it('disables "First" and "Previous" buttons when on the first page', () => {
    render(<Paginator currentPage={1} totalPages={5} maxPagesToShow={5} onPageChange={mockOnPageChange} />);

    const firstButton = screen.getByText((content, element) => {
      return element?.tagName.toLowerCase() === 'span' && content.includes('First');
    });
    expect(firstButton).toBeInTheDocument();
    expect(firstButton.closest('li')).toHaveClass('disabled');

    const previousButton = screen.getByText((content, element) => {
      return element?.tagName.toLowerCase() === 'span' && content.includes('Previous');
    });
    expect(previousButton).toBeInTheDocument();
    expect(previousButton.closest('li')).toHaveClass('disabled');
  });

  it('enables "First" and "Previous" buttons when not on the first page', () => {
    render(<Paginator currentPage={3} totalPages={5} maxPagesToShow={5} onPageChange={mockOnPageChange} />);

    expect(screen.getByRole('button', { name: /First/i })).toBeEnabled();
    expect(screen.getByRole('button', { name: /Previous/i })).toBeEnabled();
  });

  it('shows the first page and ellipsis when startPage is greater than 1', () => {
    render(<Paginator currentPage={3} totalPages={10} maxPagesToShow={5} onPageChange={mockOnPageChange} />);

    const buttons = screen.queryAllByRole('button');
    const firstPageButton = buttons.find(button => button.textContent === '1');
    expect(firstPageButton).toBeInTheDocument();

    const ellipsis = screen.getByText((_, element) => element?.textContent === '…');
    expect(ellipsis).toBeInTheDocument();
  });

  it('does not show ellipsis when startPage is 1', () => {
    render(<Paginator currentPage={1} totalPages={5} maxPagesToShow={5} onPageChange={mockOnPageChange} />);

    const firstPageButton = screen.getByText('1');
    expect(firstPageButton).toBeInTheDocument();

    expect(screen.queryByText('…')).not.toBeInTheDocument();
  });

  it('calls onPageChange with 1 when "First" button is clicked', () => {
    render(<Paginator currentPage={3} totalPages={5} maxPagesToShow={5} onPageChange={mockOnPageChange} />);

    fireEvent.click(screen.getByRole('button', { name: /First/i }));
    expect(mockOnPageChange).toHaveBeenCalledWith(1);
  });

  it('calls onPageChange with currentPage - 1 when "Previous" button is clicked', () => {
    render(<Paginator currentPage={3} totalPages={5} maxPagesToShow={5} onPageChange={mockOnPageChange} />);

    fireEvent.click(screen.getByRole('button', { name: /Previous/i }));
    expect(mockOnPageChange).toHaveBeenCalledWith(2);
  });

  it('renders as disabled when on the last page', () => {
    render(<Paginator currentPage={5} totalPages={5} maxPagesToShow={5} onPageChange={mockOnPageChange} />);

    const lastButton = screen.getByText((content, element) => {
      return element?.tagName.toLowerCase() === 'span' && content.includes('Last');
    });

    expect(lastButton).toBeInTheDocument();
    expect(lastButton.closest('li')).toHaveClass('disabled');
  });

  it('renders as enabled when not on the last page', () => {
    render(<Paginator currentPage={3} totalPages={5} maxPagesToShow={5} onPageChange={mockOnPageChange} />);

    const lastButton = screen.getByRole('button', { name: /Last/i });
    expect(lastButton).not.toBeDisabled();
  });

  it('calls onPageChange with the last page number when clicked', () => {
    render(<Paginator currentPage={3} totalPages={5} maxPagesToShow={5} onPageChange={mockOnPageChange} />);

    const lastButton = screen.getByRole('button', { name: /Last/i });
    fireEvent.click(lastButton);

    expect(mockOnPageChange).toHaveBeenCalledTimes(1);
    expect(mockOnPageChange).toHaveBeenCalledWith(5);
  });

  it('disables all navigation buttons when totalPages is 1', () => {
    render(<Paginator currentPage={1} totalPages={1} maxPagesToShow={5} onPageChange={mockOnPageChange} />);

    const navigationItems = screen.getAllByRole('listitem');

    const disabledButtons = navigationItems.filter(item => item.classList.contains('disabled'));

    expect(disabledButtons).toHaveLength(4);

    expect(disabledButtons[0]).toHaveTextContent('«'); // First
    expect(disabledButtons[1]).toHaveTextContent('‹'); // Previous
    expect(disabledButtons[2]).toHaveTextContent('›'); // Next
    expect(disabledButtons[3]).toHaveTextContent('»'); // Last
  });

  it('does not call onPageChange when clicking disabled navigation buttons', () => {
    render(<Paginator currentPage={1} totalPages={5} maxPagesToShow={5} onPageChange={mockOnPageChange} />);

    const firstButton = screen.getByText('«').closest('li');
    fireEvent.click(firstButton!);
    expect(mockOnPageChange).not.toHaveBeenCalled();

    const prevButton = screen.getByText('‹').closest('li');
    fireEvent.click(prevButton!);
    expect(mockOnPageChange).not.toHaveBeenCalled();
  });

  it('shows ellipsis and last page when endPage is less than totalPages', () => {
    render(<Paginator currentPage={3} totalPages={10} maxPagesToShow={5} onPageChange={mockOnPageChange} />);

    const ellipsis = screen.getByText((_, element) => element?.textContent === '…');
    expect(ellipsis).toBeInTheDocument();

    const lastPageButton = screen.getByText('10'); // TotalPages = 10
    expect(lastPageButton).toBeInTheDocument();

    fireEvent.click(lastPageButton);
    expect(mockOnPageChange).toHaveBeenCalledWith(10);
  });

  it('renders the first page button when startPage is greater than 1', () => {
    render(<Paginator currentPage={5} totalPages={10} maxPagesToShow={5} onPageChange={mockOnPageChange} />);

    const firstPageButton = screen.getByText('1');
    expect(firstPageButton).toBeInTheDocument();

    fireEvent.click(firstPageButton);
    expect(mockOnPageChange).toHaveBeenCalledWith(1);
  });
});
