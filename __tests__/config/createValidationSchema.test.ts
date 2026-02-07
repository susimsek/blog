import type { TFunction } from 'i18next';
import { createValidationSchema } from '@/config/createValidationSchema';

const t = ((key: string) => key) as unknown as TFunction;

describe('createValidationSchema', () => {
  const schema = createValidationSchema(t);

  it('accepts valid date range', async () => {
    const values = {
      startDate: new Date('2024-05-01'),
      endDate: new Date('2024-05-02'),
    };

    await expect(schema.validate(values)).resolves.toEqual(values);
  });

  it('rejects when start date is after end date', async () => {
    const values = {
      startDate: new Date('2024-05-03'),
      endDate: new Date('2024-05-01'),
    };

    await expect(schema.validate(values)).rejects.toMatchObject({
      errors: expect.arrayContaining(['common.validation.endDateBeforeStartDate']),
    });
  });

  it('rejects when end date is before start date', async () => {
    const values = {
      startDate: new Date('2024-05-01'),
      endDate: new Date('2024-04-30'),
    };

    await expect(schema.validate(values)).rejects.toMatchObject({
      errors: expect.arrayContaining(['common.validation.endDateBeforeStartDate']),
    });
  });
});
