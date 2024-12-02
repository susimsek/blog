import { Row, Col, Container } from 'react-bootstrap';
import Paginator from '@/components/pagination/Paginator';
import PageSizeSelector from './PageSizeSelector';
import { useTranslation } from 'next-i18next';

interface PaginationBarProps {
  currentPage: number;
  totalPages: number;
  totalResults: number;
  size: number;
  pageSizeOptions?: number[];
  maxPagesToShow?: number;
  onPageChange: (page: number) => void;
  onSizeChange: (size: number) => void;
}

export default function PaginationBar({
  currentPage,
  totalPages,
  totalResults,
  size,
  pageSizeOptions = [5, 10, 20],
  maxPagesToShow = 5,
  onPageChange,
  onSizeChange,
}: PaginationBarProps) {
  const { t } = useTranslation('common');

  const start = (currentPage - 1) * size + 1;
  const end = Math.min(currentPage * size, totalResults);

  return (
    <Container className="pagination-bar">
      <Row className="align-items-center flex-wrap">
        {/* Pagination */}
        <Col xs="auto" className="d-flex align-items-center pagination">
          <Paginator
            className="pagination mb-2"
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={onPageChange}
            maxPagesToShow={maxPagesToShow}
          />
        </Col>

        {/* Results Info */}
        <Col xs="auto" className="d-flex align-items-center results-info">
          <p className="text-muted mb-2">
            {t('common.pagination.showingResults', { start, end, total: totalResults })}
          </p>
        </Col>

        {/* Page Size Selector */}
        <Col xs="auto" className="d-flex align-items-center page-size-selector">
          <PageSizeSelector size={size} pageSizeOptions={pageSizeOptions} onSizeChange={onSizeChange} />
        </Col>
      </Row>
    </Container>
  );
}
