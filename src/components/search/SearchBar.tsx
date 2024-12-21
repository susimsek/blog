import React, { useCallback } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { useTranslation } from 'next-i18next';

interface SearchBarProps {
  query: string;
  onChange: (query: string) => void;
  className?: string;
}

export default function SearchBar({ query, onChange, className }: Readonly<SearchBarProps>) {
  const { t } = useTranslation('common');

  const handleInputChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      onChange(event.target.value);
    },
    [onChange],
  );

  const handleClear = useCallback(() => {
    onChange('');
  }, [onChange]);

  return (
    <div className={`search-bar d-flex align-items-center ${className ?? ''}`}>
      <div className="search-icon">
        <FontAwesomeIcon icon="search" />
      </div>
      <input
        type="text"
        className="search-input form-control"
        placeholder={t('common.searchBar.placeholder')}
        value={query}
        onChange={handleInputChange}
      />
      {query && (
        <button className="border-0 bg-transparent" onClick={handleClear}>
          <FontAwesomeIcon icon="times-circle" className="clear-icon" />
        </button>
      )}
    </div>
  );
}
