import { render, screen } from '@testing-library/react';
import DateDisplay from '@/components/common/DateDisplay';
const useParamsMock = jest.fn();

jest.mock('next/navigation', () => ({
  useParams: () => useParamsMock(),
}));

describe('DateDisplay', () => {
  beforeEach(() => {
    useParamsMock.mockReset();
  });

  it('renders the formatted date with router.query locale', () => {
    useParamsMock.mockReturnValue({ locale: 'fr-FR' });

    render(<DateDisplay date="2023-12-01" />);
    expect(screen.getByText('1 décembre 2023')).toBeInTheDocument();
  });

  it('renders the formatted date with locale prop', () => {
    useParamsMock.mockReturnValue({});

    render(<DateDisplay date="2023-12-01" locale="en-US" />);
    expect(screen.getByText('December 1, 2023')).toBeInTheDocument();
  });

  it('renders the formatted date with default locale', () => {
    useParamsMock.mockReturnValue({});

    render(<DateDisplay date="2023-12-01" />);
    expect(screen.getByText('December 1, 2023')).toBeInTheDocument();
  });
});
