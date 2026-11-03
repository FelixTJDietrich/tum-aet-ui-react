import type { CSSProperties, HTMLAttributes, ReactNode, Ref } from 'react';
import { cx } from '../../internal/cx';

export type ProgressBarSeverity = 'primary' | 'success' | 'warn' | 'danger' | 'info';
export type ProgressBarSize = 'small' | 'default';

export interface ProgressBarProps extends HTMLAttributes<HTMLDivElement> {
  /** 0 to 100, clamped. Ignored when `indeterminate`. */
  value?: number;
  /** Unknown duration: no `aria-valuenow`, animated bar. */
  indeterminate?: boolean;
  /** Shows the value inside the bar (never in the `small` size). */
  showValue?: boolean;
  size?: ProgressBarSize;
  severity?: ProgressBarSeverity;
  unit?: string;
  ref?: Ref<HTMLDivElement>;
  /** Replaces the value label. */
  children?: ReactNode;
}

/** Give the bar an accessible name with `aria-label` or `aria-labelledby`. */
export function ProgressBar({
  value = 0,
  indeterminate,
  showValue = true,
  size = 'default',
  severity = 'primary',
  unit = '%',
  className,
  style,
  children,
  ...rest
}: ProgressBarProps) {
  const normalized = Number.isFinite(value) ? Math.max(0, Math.min(100, value)) : 0;
  return (
    <div
      {...rest}
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={indeterminate ? undefined : normalized}
      data-size={size}
      data-indeterminate={indeterminate || undefined}
      className={cx('tumaet-ui-progress-bar', className)}
      style={style}
    >
      <div
        className="tumaet-ui-progress-bar-value"
        data-severity={severity}
        style={indeterminate ? undefined : ({ width: `${normalized}%` } satisfies CSSProperties)}
      >
        <span className="tumaet-ui-progress-bar-label">
          {children ?? (!indeterminate && showValue && normalized !== 0 ? `${normalized}${unit}` : null)}
        </span>
      </div>
    </div>
  );
}
