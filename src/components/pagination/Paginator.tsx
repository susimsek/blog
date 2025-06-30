import React, { ReactNode, useMemo, useCallback } from 'react';
import { Pagination } from 'react-bootstrap';

interface PaginatorProps {
  currentPage: number;
  totalPages: number;
  maxPagesToShow?: number; // varsayılan 7
  onPageChange: (page: number) => void;
  className?: string;
}

const Paginator: React.FC<PaginatorProps> = ({
  currentPage,
  totalPages,
  maxPagesToShow = 7,
  onPageChange,
  className = '',
}) => {
  const generatePageItems = useCallback((): (number | string)[] => {
    if (totalPages <= maxPagesToShow) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }

    const pages: (number | string)[] = [];
    pages.push(1);

    let left: number;
    let right: number;

    if (currentPage <= 4) {
      left = 2;
      right = 5;
    } else if (currentPage >= totalPages - 3) {
      left = totalPages - 4;
      right = totalPages - 1;
    } else {
      left = currentPage - 1;
      right = currentPage + 1;
    }

    if (left > 2) {
      pages.push('ellipsis');
    }

    for (let i = left; i <= right; i++) {
      pages.push(i);
    }

    if (right < totalPages - 1) {
      pages.push('ellipsis');
    }

    pages.push(totalPages);
    return pages;
  }, [currentPage, totalPages, maxPagesToShow]);

  const pageItems = useMemo(() => generatePageItems(), [generatePageItems]);
  const paginationItems: ReactNode[] = [];

  paginationItems.push(
    <Pagination.First key="first" disabled={currentPage === 1} onClick={() => onPageChange(1)} />,
    <Pagination.Prev key="prev" disabled={currentPage === 1} onClick={() => onPageChange(currentPage - 1)} />,
  );

  pageItems.forEach((item, index) => {
    if (item === 'ellipsis') {
      paginationItems.push(<Pagination.Ellipsis key={`ellipsis-${index}`} disabled />);
    } else {
      paginationItems.push(
        <Pagination.Item key={item} active={item === currentPage} onClick={() => onPageChange(Number(item))}>
          {item}
        </Pagination.Item>,
      );
    }
  });

  paginationItems.push(
    <Pagination.Next key="next" disabled={currentPage === totalPages} onClick={() => onPageChange(currentPage + 1)} />,
    <Pagination.Last key="last" disabled={currentPage === totalPages} onClick={() => onPageChange(totalPages)} />,
  );

  return <Pagination className={className}>{paginationItems}</Pagination>;
};

export default Paginator;
