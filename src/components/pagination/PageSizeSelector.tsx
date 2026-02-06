import React from 'react';
import Form from 'react-bootstrap/Form';
import { useTranslation } from 'next-i18next';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

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
    <fieldset className={`d-flex align-items-center flex-nowrap ${className}`}>
      <legend className="visually-hidden">Page size selector</legend>
      <Form.Label htmlFor="postsPerPageSelect" className="me-2 mb-0 text-muted text-nowrap">
        {t('common.pagination.pageSize')}
      </Form.Label>
      <div className="position-relative d-inline-block" style={{ width: '100px' }}>
        <Form.Select
          id="postsPerPageSelect"
          className="mb-0"
          value={size}
          onChange={e => onSizeChange(Number(e.target.value))}
        >
          {pageSizeOptions.map(option => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </Form.Select>
        <FontAwesomeIcon icon="chevron-down" className="chevron-dropdown-icon" />
      </div>
    </fieldset>
  );
};

export default PageSizeSelector;
