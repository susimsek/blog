import { CombinedGraphQLErrors, ServerError, ServerParseError } from '@apollo/client/errors';
import {
  AdminGraphQLRequestError,
  isAdminSessionError,
  resolveAdminError,
  shouldRetryAdminRefresh,
  toAdminRequestError,
} from '@/lib/admin-api/errors-core';

const serverResponse = (status: number, requestId = '') =>
  ({
    status,
    headers: new Headers(requestId ? { 'X-Request-ID': requestId } : undefined),
  }) as Response;

describe('admin API error handling', () => {
  it('normalizes request errors and distinguishes session, network, and unknown failures', () => {
    expect(
      resolveAdminError(new AdminGraphQLRequestError('expired', { code: ' unauthorized ', status: 401 })),
    ).toMatchObject({
      kind: 'session_expired',
      message: 'expired',
      code: 'UNAUTHORIZED',
      status: 401,
    });
    expect(isAdminSessionError(new AdminGraphQLRequestError('expired', { code: 'ADMIN_SESSION_INVALID' }))).toBe(true);
    expect(
      resolveAdminError(new AdminGraphQLRequestError('offline', { code: ' network_error ', requestId: ' req-1 ' })),
    ).toMatchObject({
      kind: 'network',
      message: 'offline',
      code: 'NETWORK_ERROR',
      requestId: ' req-1 ',
    });
    expect(resolveAdminError(new Error('  '))).toEqual({
      kind: 'unknown',
      message: 'Admin GraphQL request failed',
      code: undefined,
      requestId: undefined,
      status: undefined,
    });
    expect(resolveAdminError(null)).toEqual({
      kind: 'unknown',
      message: 'Admin GraphQL request failed',
      code: undefined,
      requestId: undefined,
      status: undefined,
    });
  });

  it('retries refresh only for eligible session failures', () => {
    const unauthorized = new AdminGraphQLRequestError('expired', { status: 401 });
    expect(shouldRetryAdminRefresh(unauthorized, 'AdminMe')).toBe(true);
    expect(shouldRetryAdminRefresh(unauthorized, 'AdminRefreshSession')).toBe(false);
    expect(shouldRetryAdminRefresh(unauthorized, 'AdminLogin')).toBe(false);
    expect(shouldRetryAdminRefresh(new AdminGraphQLRequestError('unavailable', { status: 500 }), 'AdminMe')).toBe(
      false,
    );
    expect(shouldRetryAdminRefresh(new AdminGraphQLRequestError('invalid'), 'AdminMe')).toBe(false);
  });

  it('maps Apollo GraphQL and HTTP errors with status and request metadata', () => {
    const graphQLError = new CombinedGraphQLErrors({
      errors: [
        { message: 'Access denied', extensions: { code: 'ADMIN_AUTH_REQUIRED', httpStatus: 401, requestId: 'gql-1' } },
      ],
    });
    expect(toAdminRequestError(graphQLError)).toMatchObject({
      name: 'AdminGraphQLRequestError',
      message: 'Access denied',
      code: 'ADMIN_AUTH_REQUIRED',
      status: 401,
      requestId: 'gql-1',
    });

    const alternateGraphQLError = new CombinedGraphQLErrors({
      errors: [{ message: 'No access', extensions: { http_status: 403 } }],
    });
    expect(toAdminRequestError(alternateGraphQLError).status).toBe(403);

    const serverError = new ServerError('HTTP failure', {
      response: serverResponse(401, 'http-1'),
      bodyText: JSON.stringify({ errors: [{ message: 'Sign in again', extensions: { code: 'UNAUTHORIZED' } }] }),
    });
    expect(toAdminRequestError(serverError)).toMatchObject({
      message: 'Sign in again',
      code: 'UNAUTHORIZED',
      status: 401,
      requestId: 'http-1',
    });
    expect(toAdminRequestError(serverError)).not.toBe(serverError);

    const malformedResponse = new ServerError('  Gateway failed  ', {
      response: serverResponse(502, 'fallback-id'),
      bodyText: '<html>',
    });
    expect(toAdminRequestError(malformedResponse)).toMatchObject({
      message: 'Gateway failed',
      status: 502,
      requestId: 'fallback-id',
    });
  });

  it('normalizes top-level server payloads and falls back from malformed error entries', () => {
    const topLevelPayload = new ServerError('fallback', {
      response: serverResponse(503, 'header-id'),
      bodyText: JSON.stringify({
        message: '  Upstream unavailable  ',
        code: ' service_unavailable ',
        requestId: ' payload-id ',
      }),
    });
    expect(toAdminRequestError(topLevelPayload)).toMatchObject({
      message: 'Upstream unavailable',
      code: 'SERVICE_UNAVAILABLE',
      status: 503,
      requestId: 'payload-id',
    });

    const malformedEntry = new ServerError('fallback', {
      response: serverResponse(500, 'header-id'),
      bodyText: JSON.stringify({ errors: [null] }),
    });
    expect(toAdminRequestError(malformedEntry)).toMatchObject({
      message: 'Admin GraphQL request failed',
      status: 500,
      requestId: 'header-id',
    });

    const emptyPayload = new ServerError('  Request failed  ', {
      response: serverResponse(502),
      bodyText: JSON.stringify({ errors: [], message: '', code: '' }),
    });
    expect(toAdminRequestError(emptyPayload)).toMatchObject({
      message: 'Request failed',
      status: 502,
    });
  });

  it('maps parse errors, generic exceptions, and non-error values', () => {
    const parseError = new ServerParseError(new Error('invalid JSON'), {
      response: serverResponse(502),
      bodyText: '<html>',
    });
    expect(toAdminRequestError(parseError)).toMatchObject({ message: 'invalid JSON', status: 502 });

    expect(toAdminRequestError(new Error('socket closed'))).toMatchObject({
      message: 'socket closed',
      code: 'NETWORK_ERROR',
    });
    expect(toAdminRequestError('unhandled')).toMatchObject({
      message: 'Admin GraphQL request failed',
      code: 'NETWORK_ERROR',
    });

    const existing = new AdminGraphQLRequestError('existing');
    expect(toAdminRequestError(existing)).toBe(existing);
  });

  it('uses fallback messages and request identifiers for empty Apollo error details', () => {
    const emptyGraphQLError = new CombinedGraphQLErrors({ errors: [] });
    expect(toAdminRequestError(emptyGraphQLError)).toMatchObject({
      message: 'Admin GraphQL request failed',
      name: 'AdminGraphQLRequestError',
    });

    const emptyServerError = new ServerError(' ', {
      response: serverResponse(500, ' request-id '),
      bodyText: '',
    });
    expect(toAdminRequestError(emptyServerError)).toMatchObject({
      message: 'Admin GraphQL request failed',
      requestId: 'request-id',
      status: 500,
    });

    const emptyParseError = new ServerParseError(new Error(' '), {
      response: serverResponse(502),
      bodyText: '',
    });
    expect(toAdminRequestError(emptyParseError)).toMatchObject({
      message: 'Admin GraphQL request failed',
      status: 502,
    });
  });
});
