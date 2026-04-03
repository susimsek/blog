import React from 'react';
import { act, renderHook } from '@testing-library/react';
import useAutoClearValue from '@/hooks/useAutoClearValue';

describe('useAutoClearValue', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('clears a value after the configured delay', () => {
    const { result } = renderHook(() => {
      const [value, setValue] = React.useState('saved');
      useAutoClearValue(value, setValue, 200);
      return value;
    });

    expect(result.current).toBe('saved');

    act(() => {
      jest.advanceTimersByTime(200);
    });

    expect(result.current).toBe('');
  });

  it('does not clear the value when auto-clear is disabled', () => {
    const { result } = renderHook(() => {
      const [value, setValue] = React.useState('saved');
      useAutoClearValue(value, setValue, 200, { when: false });
      return value;
    });

    act(() => {
      jest.advanceTimersByTime(200);
    });

    expect(result.current).toBe('saved');
  });
});
