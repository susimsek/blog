export {};

import { parse } from 'graphql';
import { resolveRequestLocale } from '@/lib/graphql/apolloClient';

const createClientMock = jest.fn();

type MockSink = {
  next: (payload: unknown) => void;
  error: (error: unknown) => void;
  complete: () => void;
};

let latestOptions: Record<string, unknown> | undefined;
let latestSinks: MockSink[] = [];
let unsubscribeSpies: jest.Mock[] = [];

jest.mock('graphql-ws', () => ({
  createClient: (options: Record<string, unknown>) => {
    latestOptions = options;
    return createClientMock(options);
  },
}));

jest.mock('@/lib/graphql/apolloClient', () => ({
  resolveRequestLocale: jest.fn(),
}));

const mockedResolveRequestLocale = jest.mocked(resolveRequestLocale);

const importSubscriptions = async () => import('@/lib/graphql/subscriptions');

describe('graphql subscriptions helper', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    latestOptions = undefined;
    latestSinks = [];
    unsubscribeSpies = [];
    mockedResolveRequestLocale.mockReturnValue('en');
    global.WebSocket = class WebSocket {} as unknown as typeof WebSocket;
    createClientMock.mockImplementation(() => ({
      subscribe: jest.fn((_operation, sink: MockSink) => {
        latestSinks.push(sink);
        const unsubscribe = jest.fn();
        unsubscribeSpies.push(unsubscribe);
        return unsubscribe;
      }),
    }));
  });

  it('creates websocket clients with locale-aware params and reconnect notifications', async () => {
    mockedResolveRequestLocale.mockReturnValue('tr');
    const { subscribeGraphQL } = await importSubscriptions();
    const connected = jest.fn();

    const dispose = subscribeGraphQL(
      'http://api-one.example.com/graphql',
      parse('subscription TestSubscription { ping }'),
      { postId: 'alpha-post' },
      {
        next: jest.fn(),
        connected,
      },
    );

    expect(createClientMock).toHaveBeenCalledTimes(1);
    expect(latestOptions).toEqual(
      expect.objectContaining({
        url: 'ws://api-one.example.com/graphql',
        lazy: true,
        keepAlive: 15000,
        retryAttempts: 10,
        connectionParams: {
          locale: 'tr',
        },
        webSocketImpl: global.WebSocket,
        on: expect.objectContaining({
          connected: expect.any(Function),
        }),
      }),
    );

    const onConnected = (latestOptions?.on as { connected: () => void }).connected;
    onConnected();
    onConnected();

    expect(connected).toHaveBeenNthCalledWith(1, false);
    expect(connected).toHaveBeenNthCalledWith(2, true);

    dispose();
    expect(unsubscribeSpies[0]).toHaveBeenCalledTimes(1);
  });

  it('reuses clients per endpoint and locale, and delivers subscription payloads safely', async () => {
    const { subscribeGraphQL } = await importSubscriptions();
    const next = jest.fn();
    const error = jest.fn();
    const complete = jest.fn();
    const connected = jest.fn();

    const dispose = subscribeGraphQL(
      'https://api-two.example.com/graphql',
      parse('subscription CommentEvent { commentEvent(postId: "alpha") { commentId } }'),
      { postId: 'alpha-post' },
      {
        next,
        error,
        complete,
        connected,
      },
    );

    subscribeGraphQL(
      'https://api-two.example.com/graphql',
      parse('subscription AnotherCommentEvent { commentEvent(postId: "alpha") { commentId } }'),
      { postId: 'alpha-post' },
      {
        next: jest.fn(),
      },
    );

    expect(createClientMock).toHaveBeenCalledTimes(1);
    expect((latestOptions?.url as string) ?? '').toBe('wss://api-two.example.com/graphql');

    latestSinks[0].next({
      data: {
        commentEvent: {
          commentId: 'root-1',
        },
      },
    });
    latestSinks[0].next({
      errors: [{ message: 'graphql failed' }],
    });
    latestSinks[0].error(new Error('socket failed'));
    latestSinks[0].complete();

    expect(next).toHaveBeenCalledWith({
      commentEvent: {
        commentId: 'root-1',
      },
    });
    expect(error).toHaveBeenCalledTimes(2);
    expect(complete).toHaveBeenCalledTimes(1);

    const onConnected = (latestOptions?.on as { connected: () => void }).connected;
    onConnected();
    expect(connected).toHaveBeenCalledWith(false);

    dispose();
    latestSinks[0].next({
      data: {
        commentEvent: {
          commentId: 'ignored-after-dispose',
        },
      },
    });
    latestSinks[0].error(new Error('ignored-after-dispose'));
    latestSinks[0].complete();

    expect(next).toHaveBeenCalledTimes(1);
    expect(error).toHaveBeenCalledTimes(2);
    expect(complete).toHaveBeenCalledTimes(1);
  });

  it('creates separate cached clients for different locales', async () => {
    const { subscribeGraphQL } = await importSubscriptions();

    mockedResolveRequestLocale.mockReturnValue('en');
    subscribeGraphQL(
      'https://api-three.example.com/graphql',
      parse('subscription FirstSubscription { ping }'),
      { postId: 'alpha-post' },
      { next: jest.fn() },
    );

    mockedResolveRequestLocale.mockReturnValue('tr');
    subscribeGraphQL(
      'https://api-three.example.com/graphql',
      parse('subscription SecondSubscription { ping }'),
      { postId: 'alpha-post' },
      { next: jest.fn() },
    );

    expect(createClientMock).toHaveBeenCalledTimes(2);
  });
});
