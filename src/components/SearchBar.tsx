import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

interface SearchBarProps {
  query: string;
  onChange: (query: string) => void;
}

export default function SearchBar({ query, onChange }: SearchBarProps) {
  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    onChange(event.target.value);
  };

  return (
    <div className="mb-4 search-bar">
      <input type="text" className="search-input" placeholder="Search" value={query} onChange={handleInputChange} />
      <div className="search-icon">
        <FontAwesomeIcon icon="search" />
      </div>
    </div>
  );
}
