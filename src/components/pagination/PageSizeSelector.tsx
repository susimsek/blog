import React from 'react';
import { Form } from 'react-bootstrap';

interface PageSizeSelectorProps {
  size: number;
  pageSizeOptions: number[];
  onSizeChange: (size: number) => void;
}

const PageSizeSelector: React.FC<PageSizeSelectorProps> = ({
  size = 5,
  pageSizeOptions = [5, 10, 20],
  onSizeChange,
}) => {
  return (
    <fieldset className="d-flex align-items-center">
      <legend className="visually-hidden">Page size selector</legend>
      <Form.Label htmlFor="postsPerPageSelect" className="me-2">
        Page size:
      </Form.Label>
      <Form.Select
        id="postsPerPageSelect"
        className="mb-2"
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
