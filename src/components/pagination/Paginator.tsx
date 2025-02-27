import React, { ReactNode } from 'react';
import { Pagination } from 'react-bootstrap';

interface PaginatorProps {
  currentPage: number;
  totalPages: number;
  maxPagesToShow?: number;
  onPageChange: (page: number) => void;
  className?: string;
}

const Paginator: React.FC<PaginatorProps> = ({
  currentPage,
  totalPages,
  maxPagesToShow = 5,
  onPageChange,
  className = '',
}) => {
  const paginationItems: ReactNode[] = [];
  const halfPagesToShow = Math.floor(maxPagesToShow / 2);

  let startPage = Math.max(1, currentPage - halfPagesToShow);
  const endPage = Math.min(totalPages, startPage + maxPagesToShow - 1);

  if (endPage - startPage < maxPagesToShow - 1) {
    startPage = Math.max(1, endPage - maxPagesToShow + 1);
  }

  paginationItems.push(
    <Pagination.First key="first" disabled={currentPage === 1} onClick={() => onPageChange(1)} />,
    <Pagination.Prev key="prev" disabled={currentPage === 1} onClick={() => onPageChange(currentPage - 1)} />,
  );

  for (let page = startPage; page <= endPage; page++) {
    paginationItems.push(
      <Pagination.Item key={page} active={page === currentPage} onClick={() => onPageChange(page)}>
        {page}
      </Pagination.Item>,
    );
  }

  paginationItems.push(
    <Pagination.Next key="next" disabled={currentPage === totalPages} onClick={() => onPageChange(currentPage + 1)} />,
    <Pagination.Last key="last" disabled={currentPage === totalPages} onClick={() => onPageChange(totalPages)} />,
  );

  return <Pagination className={className}>{paginationItems}</Pagination>;
};

export default Paginator;
