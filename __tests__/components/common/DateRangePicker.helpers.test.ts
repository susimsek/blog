import {
  getDateRangeDropdownTitle,
  getDatePickerLocale,
  resolveSelectedDateRange,
  toISODateString,
  validateDateRangeValues,
} from '@/components/common/DateRangePicker';

const t = (key: string) => key;

describe('DateRangePicker helpers', () => {
  it('normalizes locale values', () => {
    expect(getDatePickerLocale('tr')).toBe('tr');
    expect(getDatePickerLocale(['en', 'tr'])).toBe('en');
    expect(getDatePickerLocale('fr')).toBe('en');
    expect(getDatePickerLocale(undefined)).toBe('en');
  });

  it('formats dates as ISO strings', () => {
    expect(toISODateString(new Date('2024-05-09T10:00:00Z'))).toBe('2024-05-09');
  });

  it('validates required, invalid, and reversed ranges', () => {
    expect(validateDateRangeValues({ startDate: null, endDate: null }, t)).toEqual({
      startDate: 'common.validation.required',
      endDate: 'common.validation.required',
    });

    expect(validateDateRangeValues({ startDate: new Date('bad'), endDate: new Date('bad') }, t)).toEqual({
      startDate: 'common.validation.datetimelocal',
      endDate: 'common.validation.datetimelocal',
    });

    expect(
      validateDateRangeValues(
        {
          startDate: new Date('2024-06-02'),
          endDate: new Date('2024-06-01'),
        },
        t,
      ),
    ).toEqual({
      startDate: 'common.validation.startDateAfterEndDate',
      endDate: 'common.validation.endDateBeforeStartDate',
    });
  });

  it('resolves predefined and custom ranges', () => {
    const today = new Date('2024-06-15T12:00:00Z');

    expect(resolveSelectedDateRange('today', today, { startDate: null, endDate: null })).toEqual({
      startDate: '2024-06-15',
      endDate: '2024-06-15',
    });
    expect(resolveSelectedDateRange('yesterday', today, { startDate: null, endDate: null })).toEqual({
      startDate: '2024-06-14',
      endDate: '2024-06-14',
    });
    expect(resolveSelectedDateRange('last7Days', today, { startDate: null, endDate: null })).toEqual({
      startDate: '2024-06-08',
      endDate: '2024-06-15',
    });
    expect(resolveSelectedDateRange('last30Days', today, { startDate: null, endDate: null })).toEqual({
      startDate: '2024-05-16',
      endDate: '2024-06-15',
    });
    expect(
      resolveSelectedDateRange('customDate', today, {
        startDate: new Date('2024-01-10'),
        endDate: null,
      }),
    ).toEqual({
      startDate: '2024-01-10',
      endDate: undefined,
    });
    expect(resolveSelectedDateRange('unknown', today, { startDate: null, endDate: null })).toEqual({
      startDate: undefined,
      endDate: undefined,
    });
  });

  it('builds dropdown titles for confirmed and unconfirmed custom ranges', () => {
    expect(getDateRangeDropdownTitle('customDate', false, { startDate: null, endDate: null }, 'en', key => key)).toBe(
      'customDate',
    );
    expect(
      getDateRangeDropdownTitle(
        'customDate',
        true,
        { startDate: new Date('2024-01-01'), endDate: null },
        'en',
        key => key,
      ),
    ).toBe('customDate');
    expect(
      getDateRangeDropdownTitle(
        'customDate',
        true,
        { startDate: new Date('2024-01-01'), endDate: new Date('2024-01-03') },
        'en',
        key => key,
      ),
    ).toContain('1/1/2024');
    expect(getDateRangeDropdownTitle('today', false, { startDate: null, endDate: null }, 'en', key => key)).toBe(
      'today',
    );
    expect(getDateRangeDropdownTitle(null, false, { startDate: null, endDate: null }, 'en', key => key)).toBe(
      'selectDate',
    );
  });
});
