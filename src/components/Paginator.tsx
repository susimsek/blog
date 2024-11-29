import React, { ReactNode } from 'react';
import { Pagination } from 'react-bootstrap';

interface PaginatorProps {
  currentPage: number;
  totalPages: number;
  maxPagesToShow?: number;
  onPageChange: (page: number) => void;
}

const Paginator: React.FC<PaginatorProps> = ({ currentPage, totalPages, maxPagesToShow = 5, onPageChange }) => {
  const paginationItems: ReactNode[] = []; // Specify the type here
  const halfPagesToShow = Math.floor(maxPagesToShow / 2);

  let startPage = Math.max(1, Math.min(currentPage - halfPagesToShow, totalPages - maxPagesToShow + 1));
  let endPage = Math.min(totalPages, startPage + maxPagesToShow - 1);

  // Add the "First" and "Previous" buttons
  paginationItems.push(
    <Pagination.First key="first" disabled={currentPage === 1} onClick={() => onPageChange(1)} />,
    <Pagination.Prev key="prev" disabled={currentPage === 1} onClick={() => onPageChange(currentPage - 1)} />,
  );

  // Show the first page and ellipsis if needed
  if (startPage > 1) {
    paginationItems.push(
      <Pagination.Item key={1} onClick={() => onPageChange(1)}>
        1
      </Pagination.Item>,
    );
    if (startPage > 2) {
      paginationItems.push(<Pagination.Ellipsis key="start-ellipsis" disabled />);
    }
  }

  // Generate page numbers
  for (let page = startPage; page <= endPage; page++) {
    paginationItems.push(
      <Pagination.Item key={page} active={page === currentPage} onClick={() => onPageChange(page)}>
        {page}
      </Pagination.Item>,
    );
  }

  // Show the last page and ellipsis if needed
  if (endPage < totalPages) {
    if (endPage < totalPages - 1) {
      paginationItems.push(<Pagination.Ellipsis key="end-ellipsis" disabled />);
    }
    paginationItems.push(
      <Pagination.Item key={totalPages} onClick={() => onPageChange(totalPages)}>
        {totalPages}
      </Pagination.Item>,
    );
  }

  // Add the "Next" and "Last" buttons
  paginationItems.push(
    <Pagination.Next key="next" disabled={currentPage === totalPages} onClick={() => onPageChange(currentPage + 1)} />,
    <Pagination.Last key="last" disabled={currentPage === totalPages} onClick={() => onPageChange(totalPages)} />,
  );

  return <Pagination>{paginationItems}</Pagination>;
};

export default Paginator;
