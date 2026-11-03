import {
  Children,
  useEffect,
  useRef,
  useState,
  type HTMLAttributes,
  type KeyboardEvent,
  type PointerEvent,
  type ReactNode,
  type Ref,
} from 'react';
import { cx } from '../../internal/cx';
import { useTranslate } from '../../internal/i18n';

export type SplitterLayout = 'horizontal' | 'vertical';

export interface SplitterProps extends Omit<HTMLAttributes<HTMLDivElement>, 'children'> {
  /** `horizontal` places the panels side by side (Left/Right keys), `vertical` stacks them (Up/Down keys). */
  layout?: SplitterLayout;
  /** Initial relative weights (normalized to 100). Changing them resets user resizes. */
  panelSizes?: readonly [number, number];
  /** Minimum percentages per panel; impossible sums above 100 are normalized. */
  minSizes?: readonly [number, number];
  /** Local-storage key to persist the size; each layout keeps its own value. */
  stateKey?: string;
  /** Accessible name of the separator; defaults to the translated "Resize panels". */
  separatorLabel?: string;
  /** Explicit gutter size in pixels; otherwise `--tumaet-ui-splitter-divider-size`. */
  gutterSize?: number;
  /** Fixes the second panel to this CSS size and hides the separator. Both panels stay mounted. */
  collapsedSecondSize?: string;
  /** Fires on every change (drag, keyboard) with the two percentages. */
  onSizesChange?: (sizes: [number, number]) => void;
  /** Fires when a drag or keyboard step ends. */
  onResizeEnd?: (sizes: [number, number]) => void;
  /** Exactly two panels. */
  children: [ReactNode, ReactNode] | ReactNode;
  ref?: Ref<HTMLDivElement>;
}

const KEY_STEP = 2;
const KEY_STEP_SHIFT = 10;

function percentage(value: number | undefined): number {
  return Number.isFinite(value) ? Math.max(0, Math.min(100, value!)) : 0;
}

function initialSize(sizes: readonly [number, number], key: string | undefined): number {
  const [first, second] = sizes;
  const sum = first + second;
  let initial = Number.isFinite(sum) && first >= 0 && second >= 0 && sum > 0 ? (first * 100) / sum : 50;
  if (key) {
    try {
      const stored = typeof window === 'undefined' ? null : window.localStorage.getItem(key);
      if (stored !== null && Number.isFinite(Number(stored))) initial = Number(stored);
    } catch {
      // Resizing stays available when storage is disabled.
    }
  }
  return initial;
}

export function Splitter({
  layout = 'horizontal',
  panelSizes = [50, 50],
  minSizes = [10, 10],
  stateKey,
  separatorLabel,
  gutterSize,
  collapsedSecondSize,
  onSizesChange,
  onResizeEnd,
  className,
  children,
  ref,
  ...rest
}: SplitterProps) {
  const t = useTranslate();
  const rootRef = useRef<HTMLDivElement | null>(null);
  const horizontal = layout === 'horizontal';
  const storageKey = stateKey ? `${stateKey}-${layout}` : undefined;
  const signature = `${panelSizes[0]},${panelSizes[1]},${storageKey ?? ''}`;

  const first = percentage(minSizes[0]);
  const second = percentage(minSizes[1]);
  const total = first + second;
  const [minimum, otherMinimum] = total > 100 ? [(first * 100) / total, (second * 100) / total] : [first, second];
  const maximum = 100 - otherMinimum;
  const clamp = (value: number) => Math.max(minimum, Math.min(maximum, Number.isFinite(value) ? value : 50));

  // User resizes are kept until the initial sizes (or the storage key) change.
  // `resets` counts replacements of the sizes from outside; they end a running drag, like in the Angular version.
  const [state, setState] = useState(() => ({ signature, size: initialSize(panelSizes, storageKey), resets: 0 }));
  let rawSize = state.size;
  let resets = state.resets;
  if (state.signature !== signature) {
    rawSize = initialSize(panelSizes, storageKey);
    // A parent echoing the emitted sizes only differs by rounding and must not end the drag.
    if (Math.abs(clamp(rawSize) - clamp(state.size)) > 1e-9) resets += 1;
    setState({ signature, size: rawSize, resets });
  }
  const size = clamp(rawSize);

  const latest = useRef({ size, clamp, onSizesChange, onResizeEnd, storageKey });
  latest.current = { size, clamp, onSizesChange, onResizeEnd, storageKey };
  const dragCleanup = useRef<(() => void) | undefined>(undefined);
  useEffect(() => () => dragCleanup.current?.(), []);
  // Changing the constraints, layout, gutter or collapsed state, or replacing the sizes, ends a running drag.
  useEffect(() => {
    dragCleanup.current?.();
  }, [resets, layout, minSizes[0], minSizes[1], collapsedSecondSize, gutterSize]);

  const update = (value: number) => {
    const next = latest.current.clamp(value);
    latest.current.size = next;
    setState((current) => ({ ...current, size: next }));
    latest.current.onSizesChange?.([next, 100 - next]);
  };

  const persist = () => {
    const { size: current, storageKey: key } = latest.current;
    if (key) {
      try {
        window.localStorage.setItem(key, String(current));
      } catch {
        // Storage failures must not interrupt the workflow.
      }
    }
    latest.current.onResizeEnd?.([current, 100 - current]);
  };

  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (collapsedSecondSize) return;
    const decrease = horizontal ? 'ArrowLeft' : 'ArrowUp';
    const increase = horizontal ? 'ArrowRight' : 'ArrowDown';
    const step = event.shiftKey ? KEY_STEP_SHIFT : KEY_STEP;
    let value = size;
    if (event.key === decrease) value -= step;
    else if (event.key === increase) value += step;
    else if (event.key === 'Home') value = minimum;
    else if (event.key === 'End') value = maximum;
    else return;
    event.preventDefault();
    update(value);
    persist();
  };

  const onPointerDown = (event: PointerEvent<HTMLDivElement>) => {
    const root = rootRef.current;
    if (event.button !== 0 || collapsedSecondSize || !root) return;
    event.preventDefault();
    dragCleanup.current?.();
    const separator = event.currentTarget;
    const bounds = root.getBoundingClientRect();
    const gutterBounds = separator.getBoundingClientRect();
    const measuredGutter = horizontal ? gutterBounds.width : gutterBounds.height;
    const cssGutter = Number.parseFloat(getComputedStyle(separator).flexBasis);
    const fallbackGutter = gutterSize ?? (Number.isFinite(cssGutter) && cssGutter >= 0 ? cssGutter : 6);
    const available =
      (horizontal ? bounds.width : bounds.height) - (measuredGutter > 0 ? measuredGutter : fallbackGutter);
    if (available <= 0) return;
    const start = horizontal ? event.clientX : event.clientY;
    const previous = size;
    const pointerId = event.pointerId;
    separator.focus();
    separator.setPointerCapture?.(pointerId);
    // A full-viewport shield keeps embedded frames (PDF, video) from swallowing the gesture.
    const shield = document.createElement('div');
    shield.setAttribute('data-tumaet-splitter-shield', '');
    shield.setAttribute('aria-hidden', 'true');
    shield.style.cssText = `position:fixed;inset:0;z-index:2147483647;touch-action:none;user-select:none;cursor:${horizontal ? 'col-resize' : 'row-resize'}`;
    document.body.appendChild(shield);
    const onMove = (move: globalThis.PointerEvent) => {
      if (move.pointerId === pointerId)
        update(previous + (((horizontal ? move.clientX : move.clientY) - start) * 100) / available);
    };
    const cleanup = () => {
      document.removeEventListener('pointermove', onMove);
      document.removeEventListener('pointerup', onUp);
      document.removeEventListener('pointercancel', onCancelPointer);
      separator.removeEventListener('lostpointercapture', onCancelPointer);
      window.removeEventListener('blur', cancel);
      shield.remove();
      if (separator.hasPointerCapture?.(pointerId)) separator.releasePointerCapture(pointerId);
      dragCleanup.current = undefined;
    };
    function onUp(end: globalThis.PointerEvent) {
      if (end.pointerId === pointerId) {
        cleanup();
        persist();
      }
    }
    function cancel() {
      cleanup();
      update(previous);
    }
    function onCancelPointer(cancelled: globalThis.PointerEvent) {
      if (cancelled.pointerId === pointerId) cancel();
    }
    dragCleanup.current = cleanup;
    document.addEventListener('pointermove', onMove);
    document.addEventListener('pointerup', onUp);
    document.addEventListener('pointercancel', onCancelPointer);
    separator.addEventListener('lostpointercapture', onCancelPointer);
    window.addEventListener('blur', cancel);
  };

  const [firstPanel, secondPanel] = Children.toArray(children);
  const safeGutter = gutterSize !== undefined && Number.isFinite(gutterSize) ? Math.max(0, gutterSize) : undefined;

  return (
    <div
      {...rest}
      ref={(node) => {
        rootRef.current = node;
        if (typeof ref === 'function') return ref(node);
        if (ref) ref.current = node;
      }}
      data-layout={layout}
      className={cx('tumaet-ui-splitter', className)}
    >
      <div className="tumaet-ui-splitter-panel" style={{ flex: collapsedSecondSize ? '1 1 0' : `${size} 1 0` }}>
        {firstPanel}
      </div>
      <div
        className="tumaet-ui-splitter-separator"
        role="separator"
        tabIndex={0}
        hidden={!!collapsedSecondSize}
        aria-label={separatorLabel || t('tumAetUi.splitter.resize')}
        aria-orientation={horizontal ? 'vertical' : 'horizontal'}
        aria-valuenow={size}
        aria-valuemin={minimum}
        aria-valuemax={maximum}
        style={safeGutter === undefined ? undefined : { flexBasis: safeGutter }}
        onPointerDown={onPointerDown}
        onKeyDown={onKeyDown}
      />
      <div
        className="tumaet-ui-splitter-panel"
        style={{ flex: collapsedSecondSize ? `0 0 ${collapsedSecondSize}` : `${100 - size} 1 0` }}
      >
        {secondPanel}
      </div>
    </div>
  );
}
