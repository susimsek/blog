import { act, renderHook } from '@testing-library/react';
import useDebounce from '@/hooks/useDebounce';

describe('useDebounce', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('returns initial value immediately and updates after delay', () => {
    const { result, rerender } = renderHook(({ value }) => useDebounce(value, 200), {
      initialProps: { value: 'a' },
    });

    expect(result.current).toBe('a');

    rerender({ value: 'b' });
    expect(result.current).toBe('a');

    act(() => {
      jest.advanceTimersByTime(200);
    });

    expect(result.current).toBe('b');
  });
});
