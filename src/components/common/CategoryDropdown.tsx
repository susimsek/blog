import React from 'react';
import Dropdown from 'react-bootstrap/Dropdown';
import DropdownButton from 'react-bootstrap/DropdownButton';
import type { IconProp } from '@fortawesome/fontawesome-svg-core';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { useTranslation } from 'react-i18next';
import type { CategoryFilter } from '@/reducers/postsQuery';
import { getAllPostCategories } from '@/lib/postCategories';

interface CategoryDropdownProps {
  value: CategoryFilter;
  onChange: (value: CategoryFilter) => void;
}

export default function CategoryDropdown({ value, onChange }: Readonly<CategoryDropdownProps>) {
  const { t, i18n } = useTranslation('common');
  const resolvedLanguage = i18n?.resolvedLanguage ?? i18n?.language ?? 'en';
  const categories = React.useMemo(() => getAllPostCategories(resolvedLanguage), [resolvedLanguage]);

  const selectedCategory = categories.find(category => category.id === value);
  const title = selectedCategory?.name ?? t('common.categoryFilter.all');
  const variant = 'red';
  const titleIcon: IconProp = (selectedCategory?.icon ?? 'layer-group') as IconProp;

  if (categories.length === 0) {
    return null;
  }

  return (
    <DropdownButton
      id="category-dropdown"
      variant={variant}
      className="mb-2"
      align="start"
      flip={false}
      title={
        <span>
          <FontAwesomeIcon icon={titleIcon} className="me-2" />
          {title}
        </span>
      }
      onSelect={eventKey => eventKey && onChange(eventKey)}
    >
      <Dropdown.Item eventKey="all">
        <FontAwesomeIcon icon="layer-group" className="me-2" />
        {t('common.categoryFilter.all')}
        {value === 'all' && <FontAwesomeIcon icon="circle-check" className="ms-2 circle-check" />}
      </Dropdown.Item>
      {categories.map(category => (
        <Dropdown.Item key={category.id} eventKey={category.id}>
          {category.icon ? <FontAwesomeIcon icon={category.icon as IconProp} className="me-2" /> : null}
          {category.name}
          {value === category.id && <FontAwesomeIcon icon="circle-check" className="ms-2 circle-check" />}
        </Dropdown.Item>
      ))}
    </DropdownButton>
  );
}
