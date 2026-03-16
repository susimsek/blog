'use client';

import { type DocumentNode, type ExecutionResult, print } from 'graphql';
import { createClient, type Client, type Sink } from 'graphql-ws';
import { resolveRequestLocale } from '@/lib/graphql/apolloClient';

type ClientState = {
  client: Client;
  hasConnected: boolean;
  connectionListeners: Set<(reconnected: boolean) => void>;
};

const clientsByEndpoint = new Map<string, ClientState>();

type SubscriptionCallbacks<TData> = {
  next: (value: TData) => void;
  error?: (error: unknown) => void;
  complete?: () => void;
  connected?: (reconnected: boolean) => void;
};

const getSubscriptionClient = (endpoint: string) => {
  const locale = resolveRequestLocale();
  const cacheKey = `${endpoint}::${locale}`;
  const cachedClient = clientsByEndpoint.get(cacheKey);
  if (cachedClient) {
    return cachedClient;
  }

  const connectionListeners = new Set<(reconnected: boolean) => void>();
  const client = createClient({
    url: endpoint.replace(/^http/i, match => (match.toLowerCase() === 'https' ? 'wss' : 'ws')),
    lazy: true,
    keepAlive: 15000,
    retryAttempts: 10,
    connectionParams: {
      locale,
    },
    webSocketImpl: globalThis.WebSocket,
    on: {
      connected: () => {
        const state = clientsByEndpoint.get(cacheKey);
        if (!state) {
          return;
        }

        const reconnected = state.hasConnected;
        state.hasConnected = true;
        state.connectionListeners.forEach(listener => listener(reconnected));
      },
    },
  });

  const state: ClientState = {
    client,
    hasConnected: false,
    connectionListeners,
  };

  clientsByEndpoint.set(cacheKey, state);
  return state;
};

export const subscribeGraphQL = <TData, TVariables extends Record<string, unknown>>(
  endpoint: string,
  document: DocumentNode,
  variables: TVariables,
  callbacks: SubscriptionCallbacks<TData>,
) => {
  const clientState = getSubscriptionClient(endpoint);
  const client = clientState.client;
  let disposed = false;

  if (callbacks.connected) {
    clientState.connectionListeners.add(callbacks.connected);
  }

  const dispose = client.subscribe(
    {
      query: print(document),
      variables,
    },
    {
      next(payload: ExecutionResult<TData>) {
        if (disposed) {
          return;
        }

        if (Array.isArray(payload.errors) && payload.errors.length > 0) {
          callbacks.error?.(payload.errors);
          return;
        }

        if (payload.data) {
          callbacks.next(payload.data as TData);
        }
      },
      error(error) {
        if (!disposed) {
          callbacks.error?.(error);
        }
      },
      complete() {
        if (!disposed) {
          callbacks.complete?.();
        }
      },
    } satisfies Sink<ExecutionResult<TData>>,
  );

  return () => {
    disposed = true;
    if (callbacks.connected) {
      clientState.connectionListeners.delete(callbacks.connected);
    }
    dispose();
  };
};
