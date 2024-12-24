import * as yup from 'yup';
import { TFunction } from 'i18next';

export const createValidationSchema = (t: TFunction) => {
  return yup.object().shape({
    startDate: yup
      .date()
      .required(t('common.validation.required'))
      .typeError(t('common.validation.datetimelocal'))
      .test('startDateBeforeEndDate', t('common.validation.startDateAfterEndDate'), function (value) {
        const { endDate } = this.parent;
        return !(value && endDate && value > endDate);
      }),
    endDate: yup
      .date()
      .required(t('common.validation.required'))
      .typeError(t('common.validation.datetimelocal'))
      .test('endDateAfterStartDate', t('common.validation.endDateBeforeStartDate'), function (value) {
        const { startDate } = this.parent;
        return !(value && startDate && value < startDate);
      }),
  });
};
