import React, { useState, useMemo, useCallback, useEffect } from 'react';
import Dropdown from 'react-bootstrap/Dropdown';
import DropdownButton from 'react-bootstrap/DropdownButton';
import Form from 'react-bootstrap/Form';
import Button from 'react-bootstrap/Button';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { useTranslation } from 'react-i18next';
import i18nextConfig from '@/i18n/settings';
import { useRouter } from '@/navigation/router';
import DatePicker, { registerLocale } from 'react-datepicker';
import { enUS } from 'date-fns/locale/en-US';
import { tr } from 'date-fns/locale/tr';
import 'react-datepicker/dist/react-datepicker.css';
import styles from './DateRangePicker.module.scss';

interface DateRangePickerProps {
  onRangeChange: (dates: { startDate?: string; endDate?: string }) => void;
  minDate?: Date;
  maxDate?: Date;
}

type DateRangeFormValues = {
  startDate: Date | null;
  endDate: Date | null;
};

type DateRangeErrors = {
  startDate?: string;
  endDate?: string;
};

export default function DateRangePicker({
  onRangeChange,
  minDate = new Date('2024-01-01'),
  maxDate = new Date(),
}: Readonly<DateRangePickerProps>) {
  const { t } = useTranslation('common');
  const router = useRouter();
  const currentLocale = (router.query.locale as string) ?? i18nextConfig.i18n.defaultLocale;

  // Locale Mapping
  const localeMap = { en: enUS, tr };
  const selectedLocale = localeMap[currentLocale] || enUS;

  useEffect(() => {
    registerLocale('en', enUS);
    registerLocale('tr', tr);
  }, []);

  const [formValues, setFormValues] = useState<DateRangeFormValues>({
    startDate: null,
    endDate: null,
  });
  const [formErrors, setFormErrors] = useState<DateRangeErrors>({});

  const translate = useCallback((key: string) => t(`common.datePicker.${key}`), [t]);

  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [showDropdown, setShowDropdown] = useState(false);
  const [isConfirmed, setIsConfirmed] = useState(false);

  const dropdownTitle = useMemo(() => {
    if (selectedOption === 'customDate') {
      if (isConfirmed) {
        const { startDate, endDate } = formValues;
        const start = startDate ? startDate.toLocaleDateString() : '';
        const end = endDate ? endDate.toLocaleDateString() : '';
        return start && end ? `${start} - ${end}` : translate('customDate');
      }
      return translate('customDate');
    }
    return selectedOption ? translate(selectedOption) : translate('selectDate');
  }, [selectedOption, isConfirmed, formValues, translate]);

  const handleToggle = (isOpen: boolean) => {
    setShowDropdown(isOpen);
    if (!isOpen) {
      setIsConfirmed(false);
    }
  };

  const validateCustomDateRange = useCallback((): boolean => {
    const nextErrors: DateRangeErrors = {};
    const { startDate, endDate } = formValues;

    if (!startDate) {
      nextErrors.startDate = t('common.validation.required');
    } else if (Number.isNaN(startDate.getTime())) {
      nextErrors.startDate = t('common.validation.datetimelocal');
    }

    if (!endDate) {
      nextErrors.endDate = t('common.validation.required');
    } else if (Number.isNaN(endDate.getTime())) {
      nextErrors.endDate = t('common.validation.datetimelocal');
    }

    if (startDate && endDate && startDate > endDate) {
      nextErrors.startDate = t('common.validation.startDateAfterEndDate');
      nextErrors.endDate = t('common.validation.endDateBeforeStartDate');
    }

    setFormErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  }, [formValues, t]);

  const handleApplySelection = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (selectedOption !== 'customDate') {
      return;
    }

    if (!validateCustomDateRange()) {
      return;
    }

    onRangeChange({
      startDate: formValues.startDate?.toLocaleDateString(),
      endDate: formValues.endDate?.toLocaleDateString(),
    });

    setIsConfirmed(true);
    setShowDropdown(false);
  };

  const handleDateChange = (key: keyof DateRangeFormValues, date: Date | null) => {
    setFormValues(prev => ({ ...prev, [key]: date }));
    setFormErrors(prev => {
      if (!prev.startDate && !prev.endDate) {
        return prev;
      }
      const next = { ...prev };
      delete next[key];
      if (key === 'startDate') {
        delete next.endDate;
      }
      return next;
    });
  };

  const handleOptionSelect = (option: string, e?: React.MouseEvent) => {
    if (e && option === 'customDate') {
      e.preventDefault();
      e.stopPropagation();
    }

    if (option === 'customDate' && !isConfirmed) {
      setSelectedOption(option);
      return;
    }

    if (option !== 'customDate') {
      setShowDropdown(false);
    }
    setSelectedOption(option);

    const today = new Date();
    let startDate: string | undefined;
    let endDate: string | undefined;

    switch (option) {
      case 'today': {
        const todayDate = today.toLocaleDateString();
        startDate = todayDate;
        endDate = todayDate;
        break;
      }

      case 'yesterday': {
        const yesterday = new Date(today);
        yesterday.setDate(today.getDate() - 1);
        startDate = yesterday.toLocaleDateString();
        endDate = yesterday.toLocaleDateString();
        break;
      }

      case 'last7Days': {
        const lastWeek = new Date(today);
        lastWeek.setDate(today.getDate() - 7);
        startDate = lastWeek.toLocaleDateString();
        endDate = today.toLocaleDateString();
        break;
      }

      case 'last30Days': {
        const lastMonth = new Date(today);
        lastMonth.setDate(today.getDate() - 30);
        startDate = lastMonth.toLocaleDateString();
        endDate = today.toLocaleDateString();
        break;
      }

      case 'customDate': {
        const { startDate: rawStartDate, endDate: rawEndDate } = formValues;
        startDate = rawStartDate ? rawStartDate.toLocaleDateString() : undefined;
        endDate = rawEndDate ? rawEndDate.toLocaleDateString() : undefined;
        break;
      }

      default:
        break;
    }

    onRangeChange({ startDate, endDate });
  };

  const handleClearFilter = () => {
    setFormValues({
      startDate: null,
      endDate: null,
    });
    setFormErrors({});
    setSelectedOption(null);
    onRangeChange({ startDate: undefined, endDate: undefined });
    setShowDropdown(false);
  };

  const isSelectionMade = !!selectedOption;

  const minDateTime = new Date(minDate).setHours(0, 0, 0, 0);
  const maxDateTime = new Date(maxDate).setHours(23, 59, 59, 999);

  const dayClassName = (date: Date): string => {
    return date.getTime() < minDateTime || date.getTime() > maxDateTime ? 'react-datepicker__day--muted' : '';
  };

  const options = [
    { key: 'today', label: translate('today') },
    { key: 'yesterday', label: translate('yesterday') },
    { key: 'last7Days', label: translate('last7Days') },
    { key: 'last30Days', label: translate('last30Days') },
    { key: 'customDate', label: translate('customDate') },
  ];

  return (
    <Form onSubmit={handleApplySelection}>
      <DropdownButton
        id="date-range-dropdown"
        variant="orange"
        className={`${styles.datePickerDropdown} mb-2`}
        align="start"
        flip={false}
        title={
          <span>
            <FontAwesomeIcon icon="calendar-alt" className="me-2" />
            {dropdownTitle}
          </span>
        }
        show={showDropdown}
        onToggle={handleToggle}
        autoClose="outside"
      >
        {options.map(option => (
          <Dropdown.Item
            key={option.key}
            onClick={e => handleOptionSelect(option.key, e)}
            className="d-flex justify-content-between align-items-center"
          >
            {option.label}
            {selectedOption === option.key && <FontAwesomeIcon icon="circle-check" className="circle-check ms-2" />}
          </Dropdown.Item>
        ))}

        {selectedOption === 'customDate' && (
          <div className="p-3">
            <div className="d-flex flex-column mb-4">
              <Form.Label className="mb-2">{t('common.datePicker.startDateLabel')}</Form.Label>
              <div className="d-flex align-items-center">
                <FontAwesomeIcon icon="calendar-alt" className="me-2" />
                <DatePicker
                  selected={formValues.startDate}
                  onChange={date => handleDateChange('startDate', date)}
                  locale={selectedLocale}
                  dateFormat="P"
                  isClearable
                  className="form-control"
                  placeholderText={t('common.datePicker.startDatePlaceholder')}
                  minDate={minDate}
                  maxDate={maxDate}
                  dayClassName={dayClassName}
                />
              </div>
              {formErrors.startDate && <Form.Text className="text-danger mt-2">{formErrors.startDate}</Form.Text>}
            </div>
            <div className="d-flex flex-column mb-4">
              <Form.Label className="mb-2">{t('common.datePicker.endDateLabel')}</Form.Label>
              <div className="d-flex align-items-center">
                <FontAwesomeIcon icon="calendar-alt" className="me-2" />
                <DatePicker
                  selected={formValues.endDate}
                  onChange={date => handleDateChange('endDate', date)}
                  locale={selectedLocale}
                  dateFormat="P"
                  isClearable
                  className="form-control"
                  placeholderText={t('common.datePicker.endDatePlaceholder')}
                  minDate={minDate}
                  maxDate={maxDate}
                  dayClassName={dayClassName}
                />
              </div>
              {formErrors.endDate && <Form.Text className="text-danger mt-2">{formErrors.endDate}</Form.Text>}
            </div>
            <div className="d-flex align-items-center">
              <Button variant="success" type="submit" size="sm" className={styles.datePickerButton}>
                <FontAwesomeIcon icon="check" className="me-2" />
                {t('common.datePicker.applySelection')}
              </Button>
            </div>
          </div>
        )}

        {isSelectionMade && (
          <>
            <Dropdown.Divider />
            <div className={styles.datePickerClearButtonContainer}>
              <Button variant="danger" onClick={handleClearFilter} size="sm" className={styles.datePickerButton}>
                <FontAwesomeIcon icon="times" className="me-2" />
                {t('common.datePicker.clearSelection')}
              </Button>
            </div>
          </>
        )}
      </DropdownButton>
    </Form>
  );
}
