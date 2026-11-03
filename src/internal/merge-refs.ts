import type { Ref, RefCallback } from 'react';

/** Combines several refs (callback or object) into one callback ref. */
export function mergeRefs<T>(...refs: Array<Ref<T> | undefined>): RefCallback<T> {
  return (node) => {
    const cleanups: Array<() => void> = [];
    for (const ref of refs) {
      if (typeof ref === 'function') {
        const cleanup = ref(node);
        if (typeof cleanup === 'function') cleanups.push(cleanup);
      } else if (ref) {
        ref.current = node;
      }
    }
    return () => cleanups.forEach((fn) => fn());
  };
}
