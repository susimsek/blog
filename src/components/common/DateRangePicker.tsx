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
import { Controller, useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import { createValidationSchema } from '@/config/createValidationSchema';

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

  const validationSchema = createValidationSchema(t);
  const {
    handleSubmit,
    control,
    reset,
    getValues,
    clearErrors,
    formState: { errors },
  } = useForm({
    resolver: yupResolver(validationSchema),
    defaultValues: {
      startDate: undefined,
      endDate: undefined,
    },
  });

  const translate = (key: string) => t(`common.datePicker.${key}`);

  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [showDropdown, setShowDropdown] = useState(false);
  const [isConfirmed, setIsConfirmed] = useState(false);

  const dropdownTitle = useMemo(() => {
    if (selectedOption === 'customDate') {
      if (isConfirmed) {
        const { startDate, endDate } = getValues();
        const start = startDate ? startDate.toLocaleDateString() : '';
        const end = endDate ? endDate.toLocaleDateString() : '';
        return start && end ? `${start} - ${end}` : translate('customDate');
      }
      return translate('customDate');
    }
    return selectedOption ? translate(selectedOption) : translate('selectDate');
  }, [selectedOption, isConfirmed, getValues, translate]);

  const handleToggle = (isOpen: boolean) => {
    setShowDropdown(isOpen);
    if (!isOpen) {
      setIsConfirmed(false);
    }
  };

  const handleApplySelection = (data: { startDate: Date | null; endDate: Date | null }) => {
    if (selectedOption === 'customDate') {
      onRangeChange({
        startDate: data.startDate?.toLocaleDateString(),
        endDate: data.endDate?.toLocaleDateString(),
      });
    }
    setIsConfirmed(true);
    setShowDropdown(false);
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
      case 'today':
        startDate = today.toLocaleDateString();
        endDate = today.toLocaleDateString();
        break;
      case 'yesterday':
        const yesterday = new Date(today);
        yesterday.setDate(today.getDate() - 1);
        startDate = yesterday.toLocaleDateString();
        endDate = yesterday.toLocaleDateString();
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
        const { startDate: rawStartDate, endDate: rawEndDate } = getValues();
        startDate = rawStartDate ? rawStartDate.toLocaleDateString() : undefined;
        endDate = rawEndDate ? rawEndDate.toLocaleDateString() : undefined;
        break;
    }

    onRangeChange({ startDate, endDate });
  };

  const handleClearFilter = () => {
    reset();
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
    <Form onSubmit={handleSubmit(handleApplySelection)}>
      <DropdownButton
        id="date-range-dropdown"
        variant="orange"
        className="date-picker-dropdown mb-2"
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
                <Controller
                  name="startDate"
                  control={control}
                  render={({ field: { onChange, value } }) => (
                    <DatePicker
                      selected={value}
                      onChange={date => {
                        onChange(date);
                        clearErrors();
                      }}
                      locale={selectedLocale}
                      dateFormat="P"
                      isClearable
                      className="form-control"
                      placeholderText={t('common.datePicker.startDatePlaceholder')}
                      minDate={minDate}
                      maxDate={maxDate}
                      dayClassName={dayClassName}
                    />
                  )}
                />
              </div>
              {errors.startDate && <Form.Text className="text-danger mt-2">{errors.startDate.message}</Form.Text>}
            </div>
            <div className="d-flex flex-column mb-4">
              <Form.Label className="mb-2">{t('common.datePicker.endDateLabel')}</Form.Label>
              <div className="d-flex align-items-center">
                <FontAwesomeIcon icon="calendar-alt" className="me-2" />
                <Controller
                  name="endDate"
                  control={control}
                  render={({ field: { onChange, value } }) => (
                    <DatePicker
                      selected={value}
                      onChange={date => {
                        onChange(date);
                        clearErrors();
                      }}
                      locale={selectedLocale}
                      dateFormat="P"
                      isClearable
                      className="form-control"
                      placeholderText={t('common.datePicker.endDatePlaceholder')}
                      minDate={minDate}
                      maxDate={maxDate}
                      dayClassName={dayClassName}
                    />
                  )}
                />
              </div>
              {errors.endDate && <Form.Text className="text-danger mt-2">{errors.endDate.message}</Form.Text>}
            </div>
            <div className="d-flex align-items-center">
              <Button variant="success" type="submit" size="sm" className="date-picker-button">
                <FontAwesomeIcon icon="check" className="me-2" />
                {t('common.datePicker.applySelection')}
              </Button>
            </div>
          </div>
        )}

        {isSelectionMade && (
          <>
            <Dropdown.Divider />
            <div className="date-picker-clear-button-container">
              <Button variant="danger" onClick={handleClearFilter} size="sm" className="date-picker-button">
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
