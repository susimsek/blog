import { AppError, publishAppError, reportAppError, subscribeAppErrors, unknownAppError } from '@/lib/errors/appError';

describe('appError utilities', () => {
  it('creates AppError instances with metadata', () => {
    const error = new AppError('Forbidden', 'FORBIDDEN', 403, { reason: 'policy' });

    expect(error).toBeInstanceOf(Error);
    expect(error.name).toBe('AppError');
    expect(error.message).toBe('Forbidden');
    expect(error.code).toBe('FORBIDDEN');
    expect(error.status).toBe(403);
    expect(error.details).toEqual({ reason: 'policy' });
  });

  it('publishes app errors to subscribers and supports unsubscribe', () => {
    const nowSpy = jest.spyOn(Date, 'now').mockReturnValue(1_700_000_000_000);
    const listener = jest.fn();
    const unsubscribe = subscribeAppErrors(listener);
    const error = new AppError('Network down', 'NETWORK_ERROR');

    publishAppError(error, { source: 'client', operationName: 'fetchPosts' });

    expect(listener).toHaveBeenCalledWith({
      error,
      context: { source: 'client', operationName: 'fetchPosts' },
      occurredAt: 1_700_000_000_000,
    });

    unsubscribe();
    publishAppError(error, { source: 'client' });
    expect(listener).toHaveBeenCalledTimes(1);

    nowSpy.mockRestore();
  });

  it('reports app errors to console outside production', () => {
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    const error = new AppError('Timeout', 'TIMEOUT', 504, { retryable: true });

    reportAppError(error, { source: 'api', operationName: 'loadFeed' });

    expect(consoleSpy).toHaveBeenCalledWith('[AppError]', {
      source: 'api',
      operationName: 'loadFeed',
      code: 'TIMEOUT',
      status: 504,
      message: 'Timeout',
      details: { retryable: true },
    });

    consoleSpy.mockRestore();
  });

  it('does not report to console in production', () => {
    const previousNodeEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'production';
    jest.resetModules();

    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    jest.isolateModules(() => {
      const { AppError: ProdAppError, reportAppError: prodReportAppError } = require('@/lib/errors/appError');
      prodReportAppError(new ProdAppError('Oops', 'INTERNAL_ERROR'), { source: 'api' });
    });

    expect(consoleSpy).not.toHaveBeenCalled();

    consoleSpy.mockRestore();
    process.env.NODE_ENV = previousNodeEnv;
    jest.resetModules();
  });

  it('normalizes unknown errors', () => {
    const existingAppError = new AppError('Existing', 'CONFLICT', 409);
    expect(unknownAppError(existingAppError)).toBe(existingAppError);

    const nativeError = new Error('Native error');
    const wrappedNative = unknownAppError(nativeError, 'fallback');
    expect(wrappedNative).toBeInstanceOf(AppError);
    expect(wrappedNative.message).toBe('Native error');
    expect(wrappedNative.code).toBe('UNKNOWN_ERROR');
    expect(wrappedNative.details).toBe(nativeError);

    const wrappedUnknown = unknownAppError({ value: 1 }, 'Custom fallback');
    expect(wrappedUnknown.message).toBe('Custom fallback');
    expect(wrappedUnknown.code).toBe('UNKNOWN_ERROR');
    expect(wrappedUnknown.details).toEqual({ value: 1 });
  });
});
