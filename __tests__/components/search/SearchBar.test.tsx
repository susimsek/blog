import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import SearchBar from '@/components/search/SearchBar';
import { useTranslation } from 'react-i18next';

// Mock useTranslation hook
jest.mock('react-i18next', () => ({
  useTranslation: jest.fn(),
}));

// Mock FontAwesomeIcon component
jest.mock('@fortawesome/react-fontawesome', () => ({
  FontAwesomeIcon: ({ icon }: { icon: string }) => <i data-testid={`icon-${icon}`} />,
}));

describe('SearchBar Component', () => {
  const mockOnChange = jest.fn();

  beforeEach(() => {
    (useTranslation as jest.Mock).mockReturnValue({
      t: jest.fn((key: string) => key),
    });
    mockOnChange.mockClear();
  });

  it('renders the search input and icon', () => {
    render(<SearchBar query="" onChange={mockOnChange} />);

    // Check if input is rendered
    const inputElement = screen.getByPlaceholderText('common.searchBar.placeholder');
    expect(inputElement).toBeInTheDocument();

    // Check if FontAwesome search icon is rendered
    const iconElement = screen.getByTestId('icon-search');
    expect(iconElement).toBeInTheDocument();
    expect(screen.queryByTestId('search-shortcut-hint')).not.toBeInTheDocument();
  });

  it('shows shortcut hint only when enabled', () => {
    render(<SearchBar query="" onChange={mockOnChange} showShortcutHint />);

    expect(screen.getByTestId('search-shortcut-hint')).toBeInTheDocument();
  });

  it('displays the provided query value', () => {
    const query = 'Test Query';
    render(<SearchBar query={query} onChange={mockOnChange} />);

    const inputElement = screen.getByDisplayValue(query);
    expect(inputElement).toBeInTheDocument();
  });

  it('calls onChange with the updated value when input changes', () => {
    render(<SearchBar query="" onChange={mockOnChange} />);

    const inputElement = screen.getByPlaceholderText('common.searchBar.placeholder');

    fireEvent.change(inputElement, { target: { value: 'New Query' } });
    expect(mockOnChange).toHaveBeenCalledTimes(1);
    expect(mockOnChange).toHaveBeenCalledWith('New Query');
  });

  it('shows the clear icon when query is not empty', () => {
    render(<SearchBar query="Test Query" onChange={mockOnChange} />);

    const clearIcon = screen.getByTestId('icon-times-circle');
    expect(clearIcon).toBeInTheDocument();
    expect(screen.queryByTestId('search-shortcut-hint')).not.toBeInTheDocument();
  });

  it('does not show the clear icon when query is empty', () => {
    render(<SearchBar query="" onChange={mockOnChange} />);

    const clearIcon = screen.queryByTestId('icon-times-circle');
    expect(clearIcon).not.toBeInTheDocument();
  });

  it('calls onChange with an empty string when clear icon is clicked', () => {
    render(<SearchBar query="Test Query" onChange={mockOnChange} />);

    const clearIcon = screen.getByTestId('icon-times-circle');
    fireEvent.click(clearIcon);

    expect(mockOnChange).toHaveBeenCalledTimes(1);
    expect(mockOnChange).toHaveBeenCalledWith('');
  });
});
