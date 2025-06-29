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
}: Readonly<PaginationBarProps>) {
  const { t } = useTranslation('common');

  const start = (currentPage - 1) * size + 1;
  const end = Math.min(currentPage * size, totalResults);

  return (
    <Container className="pagination-bar">
      <Row className="align-items-center justify-content-between flex-wrap gy-3">
        <Col xs={12} md className="d-flex align-items-center justify-content-center justify-content-md-start">
          <p className="text-muted mb-0 text-nowrap">
            {t('common.pagination.showingResults', { start, end, total: totalResults })}
          </p>
        </Col>

        <Col xs={12} md="auto" className="d-flex justify-content-center flex-wrap">
          <Paginator
            className="pagination mb-0"
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={onPageChange}
            maxPagesToShow={maxPagesToShow}
          />
        </Col>

        <Col xs={12} md="auto" className="d-flex align-items-center justify-content-center justify-content-md-end">
          <PageSizeSelector size={size} pageSizeOptions={pageSizeOptions} onSizeChange={onSizeChange} />
        </Col>
      </Row>
    </Container>
  );
}
