import { Form, Row, Col } from 'react-bootstrap';
import Paginator from './Paginator';
import { useTranslation } from 'next-i18next';

interface PaginationBarProps {
  currentPage: number;
  totalPages: number;
  size: number;
  maxPagesToShow?: number;
  onPageChange: (page: number) => void;
  onSizeChange: (size: number) => void;
}

export default function PaginationBar({
  currentPage,
  totalPages,
  maxPagesToShow = 5,
  size,
  onPageChange,
  onSizeChange,
}: PaginationBarProps) {
  const { t } = useTranslation('common');

  return (
    <Row className="align-items-center mt-4">
      <Col>
        <Paginator
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={onPageChange}
          maxPagesToShow={maxPagesToShow}
        />
      </Col>
      <Col md="auto">
        <Form.Group controlId="postsPerPageSelect" className="d-flex align-items-center">
          <Form.Label className="me-2 mb-0">{t('common.pagination.pageSize')}:</Form.Label>
          <Form.Select value={size} onChange={e => onSizeChange(Number(e.target.value))} style={{ width: '100px' }}>
            <option value={5}>5</option>
            <option value={10}>10</option>
            <option value={20}>20</option>
          </Form.Select>
        </Form.Group>
      </Col>
    </Row>
  );
}
