'use client';

import React, { useEffect, useRef, useState } from 'react';
import Toast from 'react-bootstrap/Toast';
import ToastContainer from 'react-bootstrap/ToastContainer';
import { AppErrorCode, AppErrorEvent, subscribeAppErrors } from '@/lib/errors/appError';

type ToastTone = 'danger' | 'warning' | 'info';

type ToastItem = {
  id: number;
  event: AppErrorEvent;
  tone: ToastTone;
  title: string;
};

const AUTO_HIDE_DELAY_MS = 4500;
const MAX_VISIBLE_TOASTS = 4;
const DEDUP_WINDOW_MS = 1200;

const toTone = (code: AppErrorCode): ToastTone => {
  if (code === 'RATE_LIMITED' || code === 'TIMEOUT') return 'warning';
  if (code === 'NETWORK_ERROR') return 'warning';
  if (code === 'UNKNOWN_ERROR' || code === 'GRAPHQL_ERROR') return 'info';
  return 'danger';
};

const toTitle = (code: AppErrorCode) => {
  if (code === 'NETWORK_ERROR') return 'Network error';
  if (code === 'TIMEOUT') return 'Request timeout';
  if (code === 'RATE_LIMITED') return 'Rate limited';
  if (code === 'UNAUTHORIZED') return 'Unauthorized';
  if (code === 'FORBIDDEN') return 'Forbidden';
  if (code === 'NOT_FOUND') return 'Not found';
  if (code === 'CONFLICT') return 'Conflict';
  if (code === 'SERVICE_UNAVAILABLE') return 'Service unavailable';
  if (code === 'INTERNAL_ERROR') return 'Internal error';
  if (code === 'GRAPHQL_ERROR') return 'GraphQL error';
  return 'Unexpected error';
};

const withoutToastItem = (items: ToastItem[], id: number) => items.filter(entry => entry.id !== id);
const appendToastItem = (items: ToastItem[], item: ToastItem) => [item, ...items].slice(0, MAX_VISIBLE_TOASTS);

export default function AppErrorToasts() {
  const [items, setItems] = useState<ToastItem[]>([]);
  const lastSignatureRef = useRef<{ signature: string; occurredAt: number } | null>(null);
  const nextIdRef = useRef(1);
  const handleToastClose = (id: number) => {
    setItems(previous => withoutToastItem(previous, id));
  };

  useEffect(() => {
    return subscribeAppErrors(event => {
      const signature = `${event.error.code}:${event.error.message}:${event.context?.source ?? 'unknown'}`;
      const last = lastSignatureRef.current;
      const isDuplicate =
        last?.signature === signature &&
        event.occurredAt - (last?.occurredAt ?? Number.NEGATIVE_INFINITY) <= DEDUP_WINDOW_MS;

      if (isDuplicate) {
        return;
      }

      lastSignatureRef.current = { signature, occurredAt: event.occurredAt };
      const id = nextIdRef.current++;
      const item: ToastItem = {
        id,
        event,
        tone: toTone(event.error.code),
        title: toTitle(event.error.code),
      };

      setItems(previous => appendToastItem(previous, item));
    });
  }, []);

  if (items.length === 0) {
    return null;
  }

  return (
    <ToastContainer className="p-3" position="top-end" style={{ zIndex: 1080 }}>
      {items.map(item => (
        <Toast
          key={item.id}
          autohide
          delay={AUTO_HIDE_DELAY_MS}
          onClose={() => handleToastClose(item.id)}
          className={`toast-tone-${item.tone}`}
        >
          <Toast.Header className="toast-theme-header">
            <span className={`toast-theme-dot toast-theme-dot--${item.tone}`} aria-hidden="true" />
            <strong className="me-auto">{item.title}</strong>
            <small className="toast-theme-source">{item.event.context?.source ?? 'client'}</small>
          </Toast.Header>
          <Toast.Body>{item.event.error.message}</Toast.Body>
        </Toast>
      ))}
    </ToastContainer>
  );
}
