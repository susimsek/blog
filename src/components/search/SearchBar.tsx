// components/search/SearchBar.tsx
import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { useTranslation } from 'next-i18next';

interface SearchBarProps {
  query: string;
  onChange: (query: string) => void;
}

export default function SearchBar({ query, onChange }: SearchBarProps) {
  const { t } = useTranslation('common');

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    onChange(event.target.value);
  };

  return (
    <div className="mb-4 search-bar">
      <input
        type="text"
        className="search-input"
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
