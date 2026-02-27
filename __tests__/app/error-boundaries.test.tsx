import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import SegmentErrorPage from '@/app/error';
import GlobalError from '@/app/global-error';
import { publishAppError, reportAppError, unknownAppError } from '@/lib/errors/appError';

jest.mock('@/lib/errors/appError', () => ({
  publishAppError: jest.fn(),
  reportAppError: jest.fn(),
  unknownAppError: jest.fn((error: Error) => ({
    code: 'UNKNOWN_ERROR',
    message: error.message,
  })),
}));

describe('Next error boundary pages', () => {
  const error = new Error('boom');
  let consoleErrorSpy: jest.SpyInstance;

  beforeEach(() => {
    jest.clearAllMocks();
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => undefined);
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
  });

  it('reports segment errors and triggers reset button', () => {
    const reset = jest.fn();
    render(<SegmentErrorPage error={error} reset={reset} />);

    expect(unknownAppError).toHaveBeenCalledWith(error, 'Unexpected render error');
    expect(publishAppError).toHaveBeenCalled();
    expect(reportAppError).toHaveBeenCalled();

    fireEvent.click(screen.getByRole('button', { name: /try again/i }));
    expect(reset).toHaveBeenCalled();
  });

  it('renders global error html with lang attribute and reports error', () => {
    const reset = jest.fn();
    render(<GlobalError error={error} reset={reset} />);

    expect(document.querySelector('html')).toHaveAttribute('lang', 'en');
    expect(unknownAppError).toHaveBeenCalledWith(error, 'Unexpected global error');
    expect(publishAppError).toHaveBeenCalled();
    expect(reportAppError).toHaveBeenCalled();

    fireEvent.click(screen.getByRole('button', { name: /try again/i }));
    expect(reset).toHaveBeenCalled();
  });
});
