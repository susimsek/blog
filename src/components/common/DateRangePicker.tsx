import React, { useState, useMemo } from 'react';
import { Dropdown, DropdownButton, Form, Button } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { useTranslation } from 'next-i18next';
import i18nextConfig from '../../../next-i18next.config';
import { useRouter } from 'next/router';
import DatePicker from 'react-datepicker';
import { registerLocale } from 'react-datepicker';
import { enUS } from 'date-fns/locale/en-US';
import { tr } from 'date-fns/locale/tr';
import 'react-datepicker/dist/react-datepicker.css';

interface DateRangePickerProps {
  onRangeChange: (dates: { startDate?: string; endDate?: string }) => void;
  minDate?: Date;
  maxDate?: Date;
}

export default function DateRangePicker({
  onRangeChange,
  minDate = new Date('2024-01-01'),
  maxDate = new Date(),
}: DateRangePickerProps) {
  const { t } = useTranslation('common');
  const router = useRouter();
  const currentLocale = (router.query.locale as string) ?? i18nextConfig.i18n.defaultLocale;

  // Locale Mapping
  const localeMap = { en: enUS, tr };
  const selectedLocale = localeMap[currentLocale] || enUS;

  // Register Locales
  useMemo(() => {
    registerLocale('en', enUS);
    registerLocale('tr', tr);
  }, []);

  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [customStartDate, setCustomStartDate] = useState<Date | null>(null);
  const [customEndDate, setCustomEndDate] = useState<Date | null>(null);

  const dropdownTitle = useMemo(() => {
    if (selectedOption === 'customDate') {
      const start = customStartDate ? customStartDate.toLocaleDateString(currentLocale) : '';
      const end = customEndDate ? customEndDate.toLocaleDateString(currentLocale) : '';
      return start && end ? `${start} - ${end}` : t('common.datePicker.customDate');
    }
    return selectedOption ? t(`common.datePicker.${selectedOption}`) : t('common.datePicker.selectDate');
  }, [selectedOption, customStartDate, customEndDate, currentLocale, t]);

  const handleOptionSelect = (option: string) => {
    setSelectedOption(option);
    const today = new Date();
    let startDate: string | undefined;
    let endDate: string | undefined;

    switch (option) {
      case 'today':
        startDate = today.toLocaleDateString();
        endDate = today.toLocaleDateString();
        break;
      case 'last7Days':
        const lastWeek = new Date(today);
        lastWeek.setDate(today.getDate() - 7);
        startDate = lastWeek.toLocaleDateString();
        endDate = today.toLocaleDateString();
        break;
      case 'last30Days':
        const lastMonth = new Date(today);
        lastMonth.setDate(today.getDate() - 30);
        startDate = lastMonth.toLocaleDateString();
        endDate = today.toLocaleDateString();
        break;
      case 'customDate':
        startDate = customStartDate ? customStartDate.toLocaleDateString() : undefined;
        endDate = customEndDate ? customEndDate.toLocaleDateString() : undefined;
        break;
      default:
        startDate = undefined;
        endDate = undefined;
    }

    onRangeChange({ startDate, endDate });
  };

  const handleCustomDateChange = (start: Date | null, end: Date | null) => {
    setCustomStartDate(start);
    setCustomEndDate(end);

    if (selectedOption === 'customDate') {
      onRangeChange({
        startDate: start?.toLocaleDateString(),
        endDate: end?.toLocaleDateString(),
      });
    }
  };

  const handleClearFilter = () => {
    setSelectedOption(null);
    setCustomStartDate(null);
    setCustomEndDate(null);
    onRangeChange({ startDate: undefined, endDate: undefined });
  };

  const isSelectionMade = !!selectedOption;

  return (
    <DropdownButton
      id="date-range-dropdown"
      variant="primary"
      className="date-picker-dropdown mb-2"
      align="start"
      flip={false}
      title={
        <span>
          <FontAwesomeIcon icon="calendar-alt" className="me-2" />
          {dropdownTitle}
        </span>
      }
      autoClose="outside"
    >
      {['today', 'last7Days', 'last30Days', 'customDate'].map(option => (
        <Dropdown.Item
          key={option}
          onClick={() => handleOptionSelect(option)}
          className="d-flex justify-content-between align-items-center"
        >
          {t(`common.datePicker.${option}`)}
          {selectedOption === option && <FontAwesomeIcon icon="circle-check" className="circle-check ms-2" />}
        </Dropdown.Item>
      ))}

      {selectedOption === 'customDate' && (
        <div className="p-3">
          <div className="d-flex flex-column mb-4">
            <Form.Label className="mb-2">{t('common.datePicker.startDateLabel')}</Form.Label>
            <div className="d-flex align-items-center">
              <FontAwesomeIcon icon="calendar-alt" className="me-2" />
              <DatePicker
                selected={customStartDate}
                onChange={date => handleCustomDateChange(date, customEndDate)}
                locale={selectedLocale}
                dateFormat="P"
                isClearable
                placeholderText={t('common.datePicker.startDatePlaceholder')}
                className="form-control"
                minDate={minDate}
                maxDate={maxDate}
              />
            </div>
          </div>
          <div className="d-flex flex-column">
            <Form.Label className="mb-2">{t('common.datePicker.endDateLabel')}</Form.Label>
            <div className="d-flex align-items-center">
              <FontAwesomeIcon icon="calendar-alt" className="me-2" />
              <DatePicker
                selected={customEndDate}
                onChange={date => handleCustomDateChange(customStartDate, date)}
                locale={selectedLocale}
                dateFormat="P"
                isClearable
                placeholderText={t('common.datePicker.endDatePlaceholder')}
                className="form-control"
                minDate={minDate}
                maxDate={maxDate}
              />
            </div>
          </div>
        </div>
      )}

      {isSelectionMade && (
        <>
          <Dropdown.Divider />
          <div className="date-picker-clear-button-container">
            <Button variant="danger" onClick={handleClearFilter} size="sm" className="date-picker-clear-button">
              <FontAwesomeIcon icon="times" className="me-2" />
              {t('common.datePicker.clearSelection')}
            </Button>
          </div>
        </>
      )}
    </DropdownButton>
  );
}
