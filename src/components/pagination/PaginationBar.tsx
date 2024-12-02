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
      <Row className="align-items-center justify-content-between">
        <Col xs="12" md="auto" className="d-flex justify-content-center mb-2">
          <Paginator
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={onPageChange}
            maxPagesToShow={maxPagesToShow}
          />
        </Col>

        {/* Results Info */}
        <Col xs="12" md="auto" className="d-flex justify-content-center mb-2">
          <p className="text-muted">{t('common.pagination.showingResults', { start, end, total: totalResults })}</p>
        </Col>
      </Row>

      <Row className="align-items-center justify-content-start mt-3">
        {/* Page Size Selector */}
        <Col xs="12" md="auto" className="d-flex justify-content-start">
          <PageSizeSelector size={size} pageSizeOptions={pageSizeOptions} onSizeChange={onSizeChange} />
        </Col>
      </Row>
    </Container>
  );
}
