import { useEffect, type Dispatch, type SetStateAction } from 'react';

type UseAutoClearValueOptions<T> = {
  when?: boolean;
  nextValue?: T;
  isEmpty?: (value: T) => boolean;
};

export default function useAutoClearValue<T>(
  value: T,
  setValue: Dispatch<SetStateAction<T>>,
  delayMs: number,
  options?: UseAutoClearValueOptions<T>,
) {
  const shouldAutoClear = options?.when ?? true;
  const hasExplicitNextValue = Object.prototype.hasOwnProperty.call(options ?? {}, 'nextValue');
  const configuredNextValue = options?.nextValue;
  const configuredIsEmpty = options?.isEmpty;

  useEffect(() => {
    const isValueEmpty = configuredIsEmpty ?? ((currentValue: T) => currentValue === ('' as T));
    if (!shouldAutoClear || isValueEmpty(value)) {
      return;
    }

    const nextValue = (hasExplicitNextValue ? configuredNextValue : ('' as T)) as T;
    const timeoutId = globalThis.setTimeout(() => {
      setValue(nextValue);
    }, delayMs);

    return () => {
      globalThis.clearTimeout(timeoutId);
    };
  }, [configuredIsEmpty, configuredNextValue, delayMs, hasExplicitNextValue, setValue, shouldAutoClear, value]);
}
