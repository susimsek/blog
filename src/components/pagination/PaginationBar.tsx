import { Form, Row, Col } from 'react-bootstrap';
import Paginator from '@/components/pagination/Paginator';
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

  // Calculate the range of results currently being displayed
  const start = (currentPage - 1) * size + 1;
  const end = Math.min(currentPage * size, totalResults);

  return (
    <Row className="pagination-bar align-items-center justify-content-between mt-4">
      <Col
        xs="12"
        md="auto"
        className="mb-2 d-flex align-items-center justify-content-md-start justify-content-center"
        style={{ margin: 0, padding: 0 }}
      >
        <Paginator
          className="pagination"
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={onPageChange}
          maxPagesToShow={maxPagesToShow}
        />
      </Col>

      <Col
        xs="12"
        md="auto"
        className="mb-2 d-flex align-items-center justify-content-center text-center"
        style={{ margin: 0, padding: 0 }}
      >
        <p className="text-muted mb-0">{t('common.pagination.showingResults', { start, end, total: totalResults })}</p>
      </Col>

      <Col
        xs="12"
        md="auto"
        className="mb-2 d-flex align-items-center justify-content-md-end justify-content-center"
        style={{ margin: 0, padding: 0 }}
      >
        <Form.Group controlId="postsPerPageSelect" className="d-flex align-items-center">
          <Form.Label className="me-2 mb-0">{t('common.pagination.pageSize')}:</Form.Label>
          <Form.Select value={size} onChange={e => onSizeChange(Number(e.target.value))} style={{ width: '100px' }}>
            {pageSizeOptions.map(option => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </Form.Select>
        </Form.Group>
      </Col>
    </Row>
  );
}
