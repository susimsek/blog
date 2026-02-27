import { clamp, scheduleFrame } from '@/components/common/ReadingProgress';

describe('ReadingProgress helpers', () => {
  it('clamps progress values into range', () => {
    expect(clamp(-10, 0, 100)).toBe(0);
    expect(clamp(150, 0, 100)).toBe(100);
    expect(clamp(42, 0, 100)).toBe(42);
  });

  it('schedules frames with requestAnimationFrame and setTimeout fallbacks', () => {
    const rafMock = jest.fn((cb: FrameRequestCallback) => {
      cb(123);
      return 1;
    });
    Object.defineProperty(window, 'requestAnimationFrame', {
      configurable: true,
      value: rafMock,
    });

    const callback = jest.fn();
    scheduleFrame(callback);
    expect(callback).toHaveBeenCalledWith(123);

    Object.defineProperty(window, 'requestAnimationFrame', {
      configurable: true,
      value: undefined,
    });

    jest.useFakeTimers();
    try {
      const timeoutCallback = jest.fn();
      scheduleFrame(timeoutCallback);
      jest.runAllTimers();
      expect(timeoutCallback).toHaveBeenCalled();
    } finally {
      jest.useRealTimers();
    }
  });
});
