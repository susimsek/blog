import React from 'react';
import { render, waitFor } from '@testing-library/react';
import RootPage from '@/app/page';
import languageDetector from '@/lib/languageDetector';

const replaceMock = jest.fn();

jest.mock('next/navigation', () => ({
  useRouter: () => ({
    replace: replaceMock,
  }),
}));

jest.mock('@/lib/languageDetector', () => ({
  detect: jest.fn(),
  cache: jest.fn(),
}));

jest.mock('@/components/common/Loading', () => ({
  __esModule: true,
  default: () => <div data-testid="loading">loading</div>,
}));

describe('RootPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('redirects to detected locale and caches it', async () => {
    (languageDetector.detect as jest.Mock).mockReturnValue('tr');

    render(<RootPage />);

    await waitFor(() => {
      expect(replaceMock).toHaveBeenCalledWith('/tr');
    });
    expect(languageDetector.cache).toHaveBeenCalledWith('tr');
  });

  it('falls back to default locale for unsupported values', async () => {
    (languageDetector.detect as jest.Mock).mockReturnValue('de');

    render(<RootPage />);

    await waitFor(() => {
      expect(replaceMock).toHaveBeenCalledWith('/en');
    });
    expect(languageDetector.cache).toHaveBeenCalledWith('en');
  });
});
