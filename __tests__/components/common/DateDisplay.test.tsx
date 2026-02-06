import { render, screen } from '@testing-library/react';
import DateDisplay from '@/components/common/DateDisplay';
import { useRouter } from '@/navigation/router';

// Mock @/navigation/router
jest.mock('@/navigation/router', () => ({
  useRouter: jest.fn(),
}));

describe('DateDisplay', () => {
  beforeEach(() => {
    (useRouter as jest.Mock).mockReset();
  });

  it('renders the formatted date with router.query locale', () => {
    // Mock the router with a French locale
    (useRouter as jest.Mock).mockReturnValue({
      query: { locale: 'fr-FR' },
    });

    render(<DateDisplay date="2023-12-01" />);
    expect(screen.getByText('1 décembre 2023')).toBeInTheDocument();
  });

  it('renders the formatted date with locale prop', () => {
    // Mock the router without a locale
    (useRouter as jest.Mock).mockReturnValue({
      query: {},
    });

    render(<DateDisplay date="2023-12-01" locale="en-US" />);
    expect(screen.getByText('December 1, 2023')).toBeInTheDocument();
  });

  it('renders the formatted date with default locale', () => {
    // Mock the router without a locale
    (useRouter as jest.Mock).mockReturnValue({
      query: {},
    });

    render(<DateDisplay date="2023-12-01" />);
    expect(screen.getByText('December 1, 2023')).toBeInTheDocument();
  });
});
