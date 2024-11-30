import React from 'react';
import { InputGroup, Form } from 'react-bootstrap';
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
    <InputGroup className="mb-4">
      <InputGroup.Text className="icon">
        <FontAwesomeIcon icon="search" />
      </InputGroup.Text>
      <Form.Control type="text" placeholder="Search posts..." value={query} onChange={handleInputChange} />
    </InputGroup>
  );
}
