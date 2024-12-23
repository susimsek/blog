import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';
import DateRangePicker from '@/components/common/DateRangePicker';

jest.mock('next-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

jest.mock('next/router', () => ({
  useRouter: jest.fn().mockReturnValue({
    query: { locale: 'en' },
  }),
}));

jest.mock('@fortawesome/react-fontawesome', () => ({
  FontAwesomeIcon: () => <span>Icon</span>,
}));

describe('DateRangePicker', () => {
  const mockOnRangeChange = jest.fn();

  const defaultProps = {
    onRangeChange: mockOnRangeChange,
    minDate: new Date('2024-01-01'),
    maxDate: new Date('2024-12-31'),
  };

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('renders dropdown button with default text', () => {
    render(<DateRangePicker {...defaultProps} />);
    expect(screen.getByText(/common.datePicker.selectDate/i)).toBeInTheDocument();
  });

  it('renders dropdown options', () => {
    render(<DateRangePicker {...defaultProps} />);
    const dropdownButton = screen.getByRole('button', { name: /common.datePicker.selectDate/i });

    fireEvent.click(dropdownButton);

    expect(screen.getByText(/common.datePicker.today/i)).toBeInTheDocument();
    expect(screen.getByText(/common.datePicker.yesterday/i)).toBeInTheDocument();
    expect(screen.getByText(/common.datePicker.last7Days/i)).toBeInTheDocument();
    expect(screen.getByText(/common.datePicker.last30Days/i)).toBeInTheDocument();
    expect(screen.getByText(/common.datePicker.customDate/i)).toBeInTheDocument();
  });

  it('calls onRangeChange with today\'s date when "Today" is selected', () => {
    render(<DateRangePicker {...defaultProps} />);
    fireEvent.click(screen.getByRole('button', { name: /common.datePicker.selectDate/i }));
    fireEvent.click(screen.getByText(/common.datePicker.today/i));

    const today = new Date().toLocaleDateString();
    expect(mockOnRangeChange).toHaveBeenCalledWith({ startDate: today, endDate: today });
  });

  it('calls onRangeChange with yesterday\'s date when "Yesterday" is selected', () => {
    render(<DateRangePicker {...defaultProps} />);
    fireEvent.click(screen.getByRole('button', { name: /common.datePicker.selectDate/i }));
    fireEvent.click(screen.getByText(/common.datePicker.yesterday/i));

    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayDate = yesterday.toLocaleDateString();

    expect(mockOnRangeChange).toHaveBeenCalledWith({ startDate: yesterdayDate, endDate: yesterdayDate });
  });

  it('calls onRangeChange with last 7 days range when "Last 7 Days" is selected', () => {
    render(<DateRangePicker {...defaultProps} />);

    fireEvent.click(screen.getByRole('button', { name: /common.datePicker.selectDate/i }));
    fireEvent.click(screen.getByText(/common.datePicker.last7Days/i));
    const today = new Date();
    const lastWeek = new Date();
    lastWeek.setDate(today.getDate() - 7);

    const startDate = lastWeek.toLocaleDateString();
    const endDate = today.toLocaleDateString();

    expect(mockOnRangeChange).toHaveBeenCalledWith({ startDate, endDate });
  });

  it('calls onRangeChange with last 30 days range when "Last 30 Days" is selected', () => {
    render(<DateRangePicker {...defaultProps} />);

    fireEvent.click(screen.getByRole('button', { name: /common.datePicker.selectDate/i }));

    fireEvent.click(screen.getByText(/common.datePicker.last30Days/i));

    const today = new Date();
    const lastMonth = new Date();
    lastMonth.setDate(today.getDate() - 30);

    const startDate = lastMonth.toLocaleDateString();
    const endDate = today.toLocaleDateString();

    expect(mockOnRangeChange).toHaveBeenCalledWith({ startDate, endDate });
  });

  it('opens custom date picker when "Custom Date" is selected', () => {
    render(<DateRangePicker {...defaultProps} />);
    fireEvent.click(screen.getByRole('button', { name: /common.datePicker.selectDate/i }));
    fireEvent.click(screen.getByText(/common.datePicker.customDate/i));

    expect(screen.getByText(/common.datePicker.startDateLabel/i)).toBeInTheDocument();
    expect(screen.getByText(/common.datePicker.endDateLabel/i)).toBeInTheDocument();
  });

  it('calls onRangeChange with selected custom dates', async () => {
    const mockOnRangeChange = jest.fn();
    const defaultProps = { onRangeChange: mockOnRangeChange };

    render(<DateRangePicker {...defaultProps} />);

    fireEvent.click(screen.getByRole('button', { name: /common.datePicker.selectDate/i }));
    fireEvent.click(screen.getByText(/common.datePicker.customDate/i));

    const startDateInput = screen.getByPlaceholderText(/common.datePicker.startDatePlaceholder/i);
    const endDateInput = screen.getByPlaceholderText(/common.datePicker.endDatePlaceholder/i);

    fireEvent.change(startDateInput, { target: { value: '2024-05-01' } });
    fireEvent.change(endDateInput, { target: { value: '2024-05-10' } });

    expect(mockOnRangeChange).toHaveBeenNthCalledWith(3, {
      startDate: '5/1/2024',
      endDate: '5/10/2024',
    });
  });

  it('resets selection when clear button is clicked', () => {
    render(<DateRangePicker {...defaultProps} />);
    fireEvent.click(screen.getByRole('button', { name: /common.datePicker.selectDate/i }));
    fireEvent.click(screen.getByText(/common.datePicker.customDate/i));

    const clearButton = screen.getByRole('button', { name: /common.datePicker.clearSelection/i });
    fireEvent.click(clearButton);

    expect(mockOnRangeChange).toHaveBeenCalledWith({ startDate: undefined, endDate: undefined });
  });
});
