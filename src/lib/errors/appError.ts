export type AppErrorCode =
  | 'BAD_REQUEST'
  | 'UNAUTHORIZED'
  | 'FORBIDDEN'
  | 'NOT_FOUND'
  | 'CONFLICT'
  | 'RATE_LIMITED'
  | 'METHOD_NOT_ALLOWED'
  | 'TIMEOUT'
  | 'NETWORK_ERROR'
  | 'GRAPHQL_ERROR'
  | 'SERVICE_UNAVAILABLE'
  | 'INTERNAL_ERROR'
  | 'UNKNOWN_ERROR';

export class AppError extends Error {
  code: AppErrorCode;
  status?: number;
  details?: unknown;

  constructor(message: string, code: AppErrorCode, status?: number, details?: unknown) {
    super(message);
    this.name = 'AppError';
    this.code = code;
    this.status = status;
    this.details = details;
  }
}

export type ReportContext = {
  source: string;
  operationName?: string;
};

export type AppErrorEvent = {
  error: AppError;
  context?: ReportContext;
  occurredAt: number;
};

type AppErrorListener = (event: AppErrorEvent) => void;

const appErrorListeners = new Set<AppErrorListener>();
const isProduction = process.env.NODE_ENV === 'production';

export const subscribeAppErrors = (listener: AppErrorListener) => {
  appErrorListeners.add(listener);
  return () => {
    appErrorListeners.delete(listener);
  };
};

export const publishAppError = (error: AppError, context?: ReportContext) => {
  const event: AppErrorEvent = {
    error,
    context,
    occurredAt: Date.now(),
  };

  for (const listener of appErrorListeners) {
    listener(event);
  }
};

export const reportAppError = (error: AppError, context: ReportContext) => {
  if (isProduction) {
    return;
  }

  console.error('[AppError]', {
    source: context.source,
    operationName: context.operationName,
    code: error.code,
    status: error.status,
    message: error.message,
    details: error.details,
  });
};

export const unknownAppError = (error: unknown, message = 'Unexpected error'): AppError => {
  if (error instanceof AppError) {
    return error;
  }

  if (error instanceof Error) {
    return new AppError(error.message || message, 'UNKNOWN_ERROR', undefined, error);
  }

  return new AppError(message, 'UNKNOWN_ERROR', undefined, error);
};
