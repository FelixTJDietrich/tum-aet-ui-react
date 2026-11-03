import { useCallback, useEffect, useRef } from 'react';

export const TYPEAHEAD_DEBOUNCE_MS = 500;

/** Converts primitive values to text; objects and nullish values yield an empty string (as in the Angular library). */
export function toText(value: unknown): string {
  switch (typeof value) {
    case 'string':
      return value;
    case 'number':
    case 'boolean':
    case 'bigint':
      return String(value);
    default:
      return '';
  }
}

function property(option: unknown, key: string | undefined): unknown {
  return key && option !== null && typeof option === 'object' ? (option as Record<string, unknown>)[key] : option;
}

/** Visible label of an option: the `optionLabel` property of an object option, or the option itself. */
export function optionLabelOf(option: unknown, optionLabel?: string): string {
  return toText(property(option, optionLabel));
}

/** Value written for an option: the `optionValue` property of an object option, or the option itself. */
export function optionValueOf(option: unknown, optionValue?: string): unknown {
  return property(option, optionValue);
}

export function valuesMatch(a: unknown, b: unknown): boolean {
  return Object.is(a, b) || a === b;
}

export function isPrintableKey(event: { key: string; ctrlKey: boolean; metaKey: boolean; altKey: boolean }): boolean {
  return event.key.length === 1 && event.key !== ' ' && !event.ctrlKey && !event.metaKey && !event.altKey;
}

/** Index after an ArrowDown/ArrowUp/Home/End key press (no wrapping), or `undefined` when the key is not a navigation key. */
export function navigate(key: string, active: number, count: number): number | undefined {
  if (count === 0) return undefined;
  switch (key) {
    case 'ArrowDown':
      return Math.min(active + 1, count - 1);
    case 'ArrowUp':
      return active < 0 ? count - 1 : Math.max(active - 1, 0);
    case 'Home':
      return 0;
    case 'End':
      return count - 1;
    default:
      return undefined;
  }
}

/**
 * Type-ahead: returns a function that takes a typed character, the option labels and the active index and returns the
 * index to activate, or -1 for no match. Characters typed within 500 ms form a prefix; repeating one character cycles
 * through the options starting with it.
 */
export function useTypeahead(): {
  match: (character: string, labels: readonly string[], active: number) => number;
  reset: () => void;
} {
  const buffer = useRef('');
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const reset = useCallback(() => {
    clearTimeout(timer.current);
    buffer.current = '';
  }, []);

  useEffect(() => reset, [reset]);

  const match = useCallback((character: string, labels: readonly string[], active: number) => {
    const char = character.toLocaleLowerCase();
    clearTimeout(timer.current);
    const repeats = buffer.current.length > 0 && [...buffer.current].every((c) => c === char);
    timer.current = setTimeout(() => {
      buffer.current = '';
    }, TYPEAHEAD_DEBOUNCE_MS);
    const lower = labels.map((l) => l.toLocaleLowerCase());
    const count = lower.length;
    const find = (prefix: string, from: number) => {
      for (let offset = 0; offset < count; offset++) {
        const index = (from + offset) % count;
        if (lower[index]?.startsWith(prefix)) return index;
      }
      return -1;
    };
    if (repeats) {
      buffer.current = char;
      return find(char, active + 1);
    }
    buffer.current += char;
    // A longer prefix may still match the current option, so search from it.
    return find(buffer.current, Math.max(active, 0));
  }, []);

  return { match, reset };
}
