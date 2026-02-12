import React from 'react';
import Dropdown from 'react-bootstrap/Dropdown';
import DropdownButton from 'react-bootstrap/DropdownButton';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { useTranslation } from 'react-i18next';
import type { SourceFilter } from '@/reducers/postsQuery';
import type { IconProp } from '@fortawesome/fontawesome-svg-core';

interface SourceDropdownProps {
  value: SourceFilter;
  onChange: (value: SourceFilter) => void;
}

export default function SourceDropdown({ value, onChange }: Readonly<SourceDropdownProps>) {
  const { t } = useTranslation('common');

  const title = (() => {
    if (value === 'blog') return t('common.sourceFilter.blog');
    if (value === 'medium') return t('common.sourceFilter.medium');
    return t('common.sourceFilter.all');
  })();

  const titleIcon: IconProp =
    value === 'blog' ? 'book' : value === 'medium' ? (['fab', 'medium'] as IconProp) : 'layer-group';

  return (
    <DropdownButton
      id="source-dropdown"
      variant="brown"
      className="mb-2"
      align="start"
      flip={false}
      title={
        <span>
          <FontAwesomeIcon icon={titleIcon} className="me-2" />
          {title}
        </span>
      }
      onSelect={e => e && onChange(e as SourceFilter)}
    >
      <Dropdown.Item eventKey="all">
        <FontAwesomeIcon icon="layer-group" className="me-2" />
        {t('common.sourceFilter.all')}
        {value === 'all' && <FontAwesomeIcon icon="circle-check" className="ms-2 circle-check" />}
      </Dropdown.Item>
      <Dropdown.Item eventKey="blog">
        <FontAwesomeIcon icon="book" className="me-2" />
        {t('common.sourceFilter.blog')}
        {value === 'blog' && <FontAwesomeIcon icon="circle-check" className="ms-2 circle-check" />}
      </Dropdown.Item>
      <Dropdown.Item eventKey="medium">
        <FontAwesomeIcon icon={['fab', 'medium'] as IconProp} className="me-2" />
        {t('common.sourceFilter.medium')}
        {value === 'medium' && <FontAwesomeIcon icon="circle-check" className="ms-2 circle-check" />}
      </Dropdown.Item>
    </DropdownButton>
  );
}
