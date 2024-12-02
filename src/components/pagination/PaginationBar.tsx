// components/pagination/PaginationBar.tsx
import { Form, Row, Col } from 'react-bootstrap';
import Paginator from '@/components/pagination/Paginator';
import { useTranslation } from 'next-i18next';

interface PaginationBarProps {
  currentPage: number;
  totalPages: number;
  size: number;
  pageSizeOptions?: number[];
  maxPagesToShow?: number;
  onPageChange: (page: number) => void;
  onSizeChange: (size: number) => void;
}

export default function PaginationBar({
  currentPage,
  totalPages,
  maxPagesToShow = 5,
  size,
  pageSizeOptions = [5, 10, 20],
  onPageChange,
  onSizeChange,
}: PaginationBarProps) {
  const { t } = useTranslation('common');

  return (
    <Row className="pagination-bar align-items-center mt-4">
      <Col className="p-0">
        <Paginator
          className="pagination"
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={onPageChange}
          maxPagesToShow={maxPagesToShow}
        />
      </Col>
      <Col md="auto" className="p-0">
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
