import React from 'react';
import { Dropdown, DropdownButton } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { useTranslation } from 'next-i18next';

interface SortDropdownProps {
  sortOrder: 'asc' | 'desc';
  onChange: (order: 'asc' | 'desc') => void;
}

export function SortDropdown({ sortOrder, onChange }: Readonly<SortDropdownProps>) {
  const { t } = useTranslation('common');

  return (
    <DropdownButton
      id="sort-dropdown"
      variant="green"
      className="mb-2"
      align="start"
      flip={false}
      title={
        <span>
          <FontAwesomeIcon icon="sort" className="me-2" />
          {sortOrder === 'asc' ? t('common.sort.oldest') : t('common.sort.newest')}
        </span>
      }
      onSelect={e => e && onChange(e as 'asc' | 'desc')}
    >
      <Dropdown.Item eventKey="desc">
        {t('common.sort.newest')}
        {sortOrder === 'desc' && <FontAwesomeIcon icon="circle-check" className="ms-2 circle-check" />}
      </Dropdown.Item>
      <Dropdown.Item eventKey="asc">
        {t('common.sort.oldest')}
        {sortOrder === 'asc' && <FontAwesomeIcon icon="circle-check" className="ms-2 circle-check" />}
      </Dropdown.Item>
    </DropdownButton>
  );
}
