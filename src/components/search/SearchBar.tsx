import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { useTranslation } from 'next-i18next';

interface SearchBarProps {
  query: string;
  onChange: (query: string) => void;
  className?: string;
}

export default function SearchBar({ query, onChange, className }: Readonly<SearchBarProps>) {
  const { t } = useTranslation('common');

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    onChange(event.target.value);
  };

  return (
    <div className={`search-bar d-flex align-items-center ${className || ''}`}>
      <input
        type="text"
        className="search-input form-control me-2"
        placeholder={t('common.searchBar.placeholder')}
        value={query}
        onChange={handleInputChange}
      />
      <div className="search-icon">
        <FontAwesomeIcon icon="search" />
      </div>
    </div>
  );
}
