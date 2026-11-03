import { useCallback, useRef, useState } from 'react';

/**
 * State that is controlled when `value` is given and uncontrolled otherwise.
 * `onChange` fires in both modes.
 */
export function useControllable<T>(value: T | undefined, defaultValue: T, onChange?: (next: T) => void): [T, (next: T) => void] {
  const [inner, setInner] = useState<T>(defaultValue);
  const controlled = value !== undefined;
  const current = controlled ? value : inner;
  const latest = useRef({ controlled, onChange });
  latest.current = { controlled, onChange };
  const set = useCallback((next: T) => {
    if (!latest.current.controlled) setInner(next);
    latest.current.onChange?.(next);
  }, []);
  return [current, set];
}
