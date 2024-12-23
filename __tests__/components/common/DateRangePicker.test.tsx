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

jest.mock('react-datepicker', () => {
  const React = require('react');
  const locales = {};

  const MockDatePicker = ({
    selected,
    onChange,
    placeholderText,
    className,
    minDate,
    maxDate,
    dayClassName,
    ...props
  }) => {
    return (
      <input
        data-testid="mock-datepicker"
        placeholder={placeholderText}
        value={selected ? selected.toLocaleDateString() : ''}
        onChange={e => {
          const valueDate = new Date(e.target.value);
          if ((!minDate || valueDate >= new Date(minDate)) && (!maxDate || valueDate <= new Date(maxDate))) {
            onChange(valueDate);
          }
        }}
        className={`${className || ''} ${dayClassName ? dayClassName(new Date()) : ''}`}
        {...props}
      />
    );
  };

  const registerLocale = jest.fn((localeName, localeData) => {
    locales[localeName] = localeData;
  });

  const getRegisteredLocale = localeName => locales[localeName] || null;

  return {
    __esModule: true,
    default: MockDatePicker,
    registerLocale,
    getRegisteredLocale,
  };
});

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

  it('calls onRangeChange with custom start and end dates when "Custom Date" is selected', async () => {
    render(<DateRangePicker {...defaultProps} />);

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /common.datePicker.selectDate/i }));
    });

    await act(async () => {
      fireEvent.click(screen.getByText(/common.datePicker.customDate/i));
    });

    const startDateInput = screen.getByPlaceholderText(/common.datePicker.startDatePlaceholder/i);
    const endDateInput = screen.getByPlaceholderText(/common.datePicker.endDatePlaceholder/i);

    await act(async () => {
      fireEvent.change(startDateInput, { target: { value: '2024-05-01' } });
    });

    await act(async () => {
      fireEvent.change(endDateInput, { target: { value: '2024-05-10' } });
    });

    expect(mockOnRangeChange).toHaveBeenCalledWith({
      startDate: '5/1/2024',
      endDate: '5/10/2024',
    });
  });

  it('calls onRangeChange with undefined when "Custom Date" is selected but no dates are provided', async () => {
    render(<DateRangePicker {...defaultProps} />);

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /common.datePicker.selectDate/i }));
    });

    await act(async () => {
      fireEvent.click(screen.getByText(/common.datePicker.customDate/i));
    });

    expect(mockOnRangeChange).toHaveBeenCalledWith({
      startDate: undefined,
      endDate: undefined,
    });
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

  it('falls back to enUS when currentLocale is not valid and displays custom date fields correctly', () => {
    const { query } = jest.requireMock('next/router').useRouter();
    query.locale = 'fr';

    render(<DateRangePicker {...defaultProps} />);

    fireEvent.click(screen.getByRole('button', { name: /common.datePicker.selectDate/i }));

    fireEvent.click(screen.getByText(/common.datePicker.customDate/i));

    const startDateInput = screen.getByPlaceholderText(/common.datePicker.startDatePlaceholder/i);
    const endDateInput = screen.getByPlaceholderText(/common.datePicker.endDatePlaceholder/i);

    expect(startDateInput).toBeInTheDocument();
    expect(startDateInput).toHaveAttribute('placeholder', 'common.datePicker.startDatePlaceholder');

    expect(endDateInput).toBeInTheDocument();
    expect(endDateInput).toHaveAttribute('placeholder', 'common.datePicker.endDatePlaceholder');
  });
});
