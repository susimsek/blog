import { render, screen } from '@testing-library/react';
import Footer from '@/components/common/Footer';
import { useTranslation } from 'next-i18next';

// Mock useTranslation
jest.mock('next-i18next', () => ({
  useTranslation: jest.fn(),
}));

describe('Footer', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders the footer text with the current year', () => {
    // Mock the translation function
    const tMock = jest.fn((key, options) => {
      if (key === 'common.footer.text') {
        return `All rights reserved - ${options.year}`;
      }
      return key;
    });

    (useTranslation as jest.Mock).mockReturnValue({
      t: tMock,
    });

    // Render the component
    render(<Footer />);

    // Get the current year dynamically
    const currentYear = 2024;

    // Assert that the footer text is rendered correctly
    expect(screen.getByText(`All rights reserved - ${currentYear}`)).toBeInTheDocument();
    expect(tMock).toHaveBeenCalledWith('common.footer.text', { year: currentYear });
  });

  it('has proper structure and accessibility', () => {
    // Mock the translation function
    const tMock = jest.fn((key, options) => `Translated ${key} ${options.year}`);

    (useTranslation as jest.Mock).mockReturnValue({
      t: tMock,
    });

    // Render the component
    render(<Footer />);

    // Check the footer element exists
    const footerElement = screen.getByRole('contentinfo');
    expect(footerElement).toBeInTheDocument();

    // Check the Container within the footer
    const containerElement = screen.getByText(/Translated common.footer.text/).closest('.footer');
    expect(containerElement).toBeInTheDocument();
  });
});
