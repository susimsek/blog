import React from 'react';
import { Form } from 'react-bootstrap';
import { useTranslation } from 'next-i18next';

interface PageSizeSelectorProps {
  size?: number;
  pageSizeOptions?: number[];
  onSizeChange: (size: number) => void;
  className?: string;
}

const PageSizeSelector: React.FC<PageSizeSelectorProps> = ({
  size = 5,
  pageSizeOptions = [5, 10, 20],
  onSizeChange,
  className = '',
}) => {
  const { t } = useTranslation('common');

  return (
    <fieldset className={`d-flex align-items-center ${className}`}>
      <legend className="visually-hidden">Page size selector</legend>
      <Form.Label htmlFor="postsPerPageSelect" className="me-2 mb-0">
        {t('common.pagination.pageSize')}
      </Form.Label>
      <Form.Select
        id="postsPerPageSelect"
        className="mb-0"
        value={size}
        onChange={e => onSizeChange(Number(e.target.value))}
        style={{ width: '100px' }}
      >
        {pageSizeOptions.map(option => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </Form.Select>
    </fieldset>
  );
};

export default PageSizeSelector;
