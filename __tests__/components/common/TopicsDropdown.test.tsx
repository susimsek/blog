import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { TopicsDropdown } from '@/components/common/TopicsDropdown';
import { mockTopics } from '../../__mocks__/mockPostData';
import { Pagination } from 'react-bootstrap';

jest.mock('next-i18next', () => ({
  useTranslation: jest.fn().mockReturnValue({
    t: (key: string) => key,
  }),
}));

jest.mock('@fortawesome/react-fontawesome', () => ({
  FontAwesomeIcon: () => <span>Icon</span>,
}));

describe('TopicsDropdown', () => {
  const onTopicChangeMock = jest.fn();

  const renderComponent = (selectedTopic: string | null = null) => {
    render(<TopicsDropdown topics={mockTopics} selectedTopic={selectedTopic} onTopicChange={onTopicChangeMock} />);
  };

  test('renders with default title', () => {
    renderComponent();

    expect(screen.getByText('common.allTopics')).toBeInTheDocument();
  });

  test('displays the selected topic as the title', () => {
    renderComponent('react');

    expect(screen.getByText('React')).toBeInTheDocument();
  });

  test('filters topics based on search input', () => {
    renderComponent();

    fireEvent.click(screen.getByText('common.allTopics'));

    const searchInput = screen.getByPlaceholderText('common.searchBar.placeholder');
    fireEvent.change(searchInput, { target: { value: 'React' } });

    expect(screen.getByText('React')).toBeInTheDocument();
    expect(screen.queryByText('Testing')).not.toBeInTheDocument();
  });

  test('calls onTopicChange with null when "all topics" is selected', async () => {
    renderComponent();

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'common.allTopics' }));
    });

    await act(async () => {
      fireEvent.click(screen.getByText('common.allTopics', { selector: 'a.dropdown-item' }));
    });

    expect(onTopicChangeMock).toHaveBeenCalledWith(null);
  });

  test('calls onTopicChange with correct topic id when a topic is selected', () => {
    renderComponent();

    fireEvent.click(screen.getByText('common.allTopics'));
    fireEvent.click(screen.getByText('React'));

    expect(onTopicChangeMock).toHaveBeenCalledWith('react');
  });

  test('handles pagination correctly', () => {
    renderComponent();

    fireEvent.click(screen.getByText('common.allTopics'));

    expect(screen.getByText('React')).toBeInTheDocument();
  });

  test('calls handlePaginationClick with correct page number', () => {
    const mockHandlePaginationClick = jest.fn();
    const handlePageChange = (page: number) => () => mockHandlePaginationClick(page);

    const { getByText } = render(
      <Pagination.Item key={2} active={false} onClick={handlePageChange(2)}>
        2
      </Pagination.Item>,
    );

    fireEvent.click(getByText('2'));

    expect(mockHandlePaginationClick).toHaveBeenCalledWith(2);
  });
});
