import * as yup from 'yup';
import { TFunction } from 'i18next';

export const createValidationSchema = (t: TFunction) => {
  return yup.object().shape({
    startDate: yup.date().required(t('common.validation.required')).typeError(t('common.validation.datetimelocal')),
    endDate: yup
      .date()
      .required(t('common.validation.required'))
      .typeError(t('common.validation.datetimelocal'))
      .min(yup.ref('startDate'), t('common.validation.endDateBeforeStartDate')),
  });
};
