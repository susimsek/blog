import { useEffect, type Dispatch, type SetStateAction } from 'react';

type UseAutoClearValueOptions = {
  when?: boolean;
  nextValue?: string;
};

export default function useAutoClearValue(
  value: string,
  setValue: Dispatch<SetStateAction<string>>,
  delayMs: number,
  options?: UseAutoClearValueOptions,
) {
  const shouldAutoClear = options?.when ?? true;
  const nextValue = options?.nextValue ?? '';

  useEffect(() => {
    if (!shouldAutoClear || value === '') {
      return;
    }

    const timeoutId = globalThis.setTimeout(() => {
      setValue(nextValue);
    }, delayMs);

    return () => {
      globalThis.clearTimeout(timeoutId);
    };
  }, [delayMs, nextValue, setValue, shouldAutoClear, value]);
}
