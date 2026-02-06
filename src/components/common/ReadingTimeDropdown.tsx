import React from 'react';
import Dropdown from 'react-bootstrap/Dropdown';
import DropdownButton from 'react-bootstrap/DropdownButton';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { useTranslation } from 'next-i18next';
import type { ReadingTimeRange } from '@/reducers/postsQuery';

interface ReadingTimeDropdownProps {
  value: ReadingTimeRange;
  onChange: (value: ReadingTimeRange) => void;
}

export default function ReadingTimeDropdown({ value, onChange }: Readonly<ReadingTimeDropdownProps>) {
  const { t } = useTranslation('common');

  const title = (() => {
    if (value === 'any') return t('common.readingTimeFilter.any');
    if (value === '3-7') return t('common.readingTimeFilter.range3to7');
    if (value === '8-12') return t('common.readingTimeFilter.range8to12');
    return t('common.readingTimeFilter.range15plus');
  })();

  return (
    <DropdownButton
      id="reading-time-dropdown"
      variant="blue"
      className="mb-2"
      align="start"
      flip={false}
      title={
        <span>
          <FontAwesomeIcon icon="clock" className="me-2" />
          {title}
        </span>
      }
      onSelect={e => e && onChange(e as ReadingTimeRange)}
    >
      <Dropdown.Item eventKey="any">
        {t('common.readingTimeFilter.any')}
        {value === 'any' && <FontAwesomeIcon icon="circle-check" className="ms-2 circle-check" />}
      </Dropdown.Item>
      <Dropdown.Item eventKey="3-7">
        {t('common.readingTimeFilter.range3to7')}
        {value === '3-7' && <FontAwesomeIcon icon="circle-check" className="ms-2 circle-check" />}
      </Dropdown.Item>
      <Dropdown.Item eventKey="8-12">
        {t('common.readingTimeFilter.range8to12')}
        {value === '8-12' && <FontAwesomeIcon icon="circle-check" className="ms-2 circle-check" />}
      </Dropdown.Item>
      <Dropdown.Item eventKey="15+">
        {t('common.readingTimeFilter.range15plus')}
        {value === '15+' && <FontAwesomeIcon icon="circle-check" className="ms-2 circle-check" />}
      </Dropdown.Item>
    </DropdownButton>
  );
}
