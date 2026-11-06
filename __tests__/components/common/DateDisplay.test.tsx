import { render, screen } from '@testing-library/react';
import DateDisplay from '@/components/common/DateDisplay';
const mockI18n = { language: 'en', resolvedLanguage: 'en' };
const mockUseParams = jest.fn(() => ({ locale: 'en' }));

jest.mock('next/navigation', () => ({
  useParams: () => mockUseParams(),
}));

jest.mock('react-i18next', () => ({
  useTranslation: () => ({ i18n: mockI18n }),
}));

describe('DateDisplay', () => {
  beforeEach(() => {
    mockI18n.language = 'en';
    mockI18n.resolvedLanguage = 'en';
    mockUseParams.mockReturnValue({ locale: 'en' });
  });

  it('formats the date using the locale in the current route', () => {
    mockUseParams.mockReturnValue({ locale: 'tr' });

    render(<DateDisplay date="2023-12-01" />);
    expect(screen.getByText('1 Aralık 2023')).toBeInTheDocument();
  });

  it('renders the formatted date with locale prop', () => {
    render(<DateDisplay date="2023-12-01" locale="en-US" />);
    expect(screen.getByText('December 1, 2023')).toBeInTheDocument();
  });

  it('renders the formatted date with default locale', () => {
    render(<DateDisplay date="2023-12-01" />);
    expect(screen.getByText('December 1, 2023')).toBeInTheDocument();
  });
});
