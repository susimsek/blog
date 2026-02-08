import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import DateRangePicker from '@/components/common/DateRangePicker';

const useParamsMock = jest.fn().mockReturnValue({ locale: 'en' });

jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

jest.mock('next/navigation', () => ({
  useParams: () => useParamsMock(),
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
    dateFormat,
    isClearable,
    locale,
    ...props
  }) => {
    void dateFormat;
    void isClearable;
    void locale;

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

const toISODateString = (value: Date) => {
  const year = value.getFullYear();
  const month = String(value.getMonth() + 1).padStart(2, '0');
  const day = String(value.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const click = async (element: HTMLElement) => {
  await act(async () => {
    fireEvent.click(element);
  });
};

const change = async (element: HTMLElement, value: string) => {
  await act(async () => {
    fireEvent.change(element, { target: { value } });
  });
};

describe('DateRangePicker', () => {
  const mockOnRangeChange = jest.fn();

  const defaultProps = {
    onRangeChange: mockOnRangeChange,
    minDate: new Date('2024-01-01'),
    maxDate: new Date('2024-12-31'),
  };

  beforeEach(() => {
    useParamsMock.mockReturnValue({ locale: 'en' });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('renders dropdown button with default text', () => {
    render(<DateRangePicker {...defaultProps} />);
    expect(screen.getByText(/common.datePicker.selectDate/i)).toBeInTheDocument();
  });

  it('renders dropdown options', async () => {
    render(<DateRangePicker {...defaultProps} />);
    const dropdownButton = screen.getByRole('button', { name: /common.datePicker.selectDate/i });

    await click(dropdownButton);

    expect(screen.getByText(/common.datePicker.today/i)).toBeInTheDocument();
    expect(screen.getByText(/common.datePicker.yesterday/i)).toBeInTheDocument();
    expect(screen.getByText(/common.datePicker.last7Days/i)).toBeInTheDocument();
    expect(screen.getByText(/common.datePicker.last30Days/i)).toBeInTheDocument();
    expect(screen.getByText(/common.datePicker.customDate/i)).toBeInTheDocument();
  });

  it('calls onRangeChange with today\'s date when "Today" is selected', async () => {
    render(<DateRangePicker {...defaultProps} />);
    await click(screen.getByRole('button', { name: /common.datePicker.selectDate/i }));
    await click(screen.getByText(/common.datePicker.today/i));

    const today = toISODateString(new Date());
    expect(mockOnRangeChange).toHaveBeenCalledWith({ startDate: today, endDate: today });
  });

  it('calls onRangeChange with yesterday\'s date when "Yesterday" is selected', async () => {
    render(<DateRangePicker {...defaultProps} />);
    await click(screen.getByRole('button', { name: /common.datePicker.selectDate/i }));
    await click(screen.getByText(/common.datePicker.yesterday/i));

    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayDate = toISODateString(yesterday);

    expect(mockOnRangeChange).toHaveBeenCalledWith({ startDate: yesterdayDate, endDate: yesterdayDate });
  });

  it('calls onRangeChange with last 7 days range when "Last 7 Days" is selected', async () => {
    render(<DateRangePicker {...defaultProps} />);

    await click(screen.getByRole('button', { name: /common.datePicker.selectDate/i }));
    await click(screen.getByText(/common.datePicker.last7Days/i));
    const today = new Date();
    const lastWeek = new Date();
    lastWeek.setDate(today.getDate() - 7);

    const startDate = toISODateString(lastWeek);
    const endDate = toISODateString(today);

    expect(mockOnRangeChange).toHaveBeenCalledWith({ startDate, endDate });
  });

  it('calls onRangeChange with last 30 days range when "Last 30 Days" is selected', async () => {
    render(<DateRangePicker {...defaultProps} />);

    await click(screen.getByRole('button', { name: /common.datePicker.selectDate/i }));

    await click(screen.getByText(/common.datePicker.last30Days/i));

    const today = new Date();
    const lastMonth = new Date();
    lastMonth.setDate(today.getDate() - 30);

    const startDate = toISODateString(lastMonth);
    const endDate = toISODateString(today);

    expect(mockOnRangeChange).toHaveBeenCalledWith({ startDate, endDate });
  });

  it('opens custom date picker when "Custom Date" is selected', async () => {
    render(<DateRangePicker {...defaultProps} />);
    await click(screen.getByRole('button', { name: /common.datePicker.selectDate/i }));
    await click(screen.getByText(/common.datePicker.customDate/i));

    expect(screen.getByText(/common.datePicker.startDateLabel/i)).toBeInTheDocument();
    expect(screen.getByText(/common.datePicker.endDateLabel/i)).toBeInTheDocument();
  });

  it('resets selection when clear button is clicked', async () => {
    render(<DateRangePicker {...defaultProps} />);
    await click(screen.getByRole('button', { name: /common.datePicker.selectDate/i }));
    await click(screen.getByText(/common.datePicker.customDate/i));

    const clearButton = screen.getByRole('button', { name: /common.datePicker.clearSelection/i });
    await click(clearButton);

    expect(mockOnRangeChange).toHaveBeenCalledWith({ startDate: undefined, endDate: undefined });
  });

  it('falls back to enUS when currentLocale is not valid and displays custom date fields correctly', async () => {
    useParamsMock.mockReturnValue({ locale: 'fr' });

    render(<DateRangePicker {...defaultProps} />);

    await click(screen.getByRole('button', { name: /common.datePicker.selectDate/i }));

    await click(screen.getByText(/common.datePicker.customDate/i));

    const startDateInput = screen.getByPlaceholderText(/common.datePicker.startDatePlaceholder/i);
    const endDateInput = screen.getByPlaceholderText(/common.datePicker.endDatePlaceholder/i);

    expect(startDateInput).toBeInTheDocument();
    expect(startDateInput).toHaveAttribute('placeholder', 'common.datePicker.startDatePlaceholder');

    expect(endDateInput).toBeInTheDocument();
    expect(endDateInput).toHaveAttribute('placeholder', 'common.datePicker.endDatePlaceholder');
  });

  it('applies custom range when selection is confirmed', async () => {
    render(<DateRangePicker {...defaultProps} />);

    const toggle = screen.getByRole('button', { name: /common.datePicker.selectDate/i });
    await click(toggle);
    const customOption = screen.getAllByRole('button', { name: /common\.datePicker\.customDate/i }).at(-1);
    if (!customOption) {
      throw new Error('Custom option not found');
    }
    await click(customOption);

    await change(screen.getByPlaceholderText(/common.datePicker.startDatePlaceholder/i), '5/1/2024');
    await change(screen.getByPlaceholderText(/common.datePicker.endDatePlaceholder/i), '5/5/2024');

    await click(screen.getByRole('button', { name: /common.datePicker.applySelection/i }));

    const expectedStart = '2024-05-01';
    const expectedEnd = '2024-05-05';

    await waitFor(() => {
      expect(mockOnRangeChange).toHaveBeenCalledWith({
        startDate: expectedStart,
        endDate: expectedEnd,
      });
    });
  });

  it('applies muted day class when current day is outside range', async () => {
    render(<DateRangePicker {...defaultProps} minDate={new Date('2100-01-01')} maxDate={new Date('2100-12-31')} />);

    await click(screen.getByRole('button', { name: /common.datePicker.selectDate/i }));
    await click(screen.getByText(/common.datePicker.customDate/i));

    const startInput = screen.getByPlaceholderText(/common.datePicker.startDatePlaceholder/i);
    expect(startInput.className).toContain('react-datepicker__day--muted');
  });

  it('keeps normal day class when current day is within range', async () => {
    render(<DateRangePicker onRangeChange={mockOnRangeChange} />);
    await click(screen.getByRole('button', { name: /common.datePicker.selectDate/i }));
    await click(screen.getByText(/common.datePicker.customDate/i));

    const startInput = screen.getByPlaceholderText(/common.datePicker.startDatePlaceholder/i);
    expect(startInput.className).not.toContain('react-datepicker__day--muted');
  });

  it('reuses confirmed custom date values when custom option is clicked again', async () => {
    render(<DateRangePicker {...defaultProps} />);
    await click(screen.getByRole('button', { name: /common.datePicker.selectDate/i }));
    await click(screen.getByText(/common.datePicker.customDate/i));

    await change(screen.getByPlaceholderText(/common.datePicker.startDatePlaceholder/i), '6/1/2024');
    await change(screen.getByPlaceholderText(/common.datePicker.endDatePlaceholder/i), '6/2/2024');
    await click(screen.getByRole('button', { name: /common.datePicker.applySelection/i }));

    const toggle = screen.getAllByRole('button', { name: /common.datePicker.customDate/i })[0];
    await click(toggle);
    const customOption = screen.getAllByRole('button', { name: /common.datePicker.customDate/i }).at(-1);
    if (!customOption) {
      throw new Error('Custom option not found');
    }
    await click(customOption);

    await waitFor(() => {
      expect(mockOnRangeChange).toHaveBeenLastCalledWith({
        startDate: '2024-06-01',
        endDate: '2024-06-02',
      });
    });
  });
});
