import type { HTMLAttributes, Ref } from 'react';
import { cx } from '../../internal/cx';

export interface ProgressSpinnerProps extends HTMLAttributes<HTMLDivElement> {
  ref?: Ref<HTMLDivElement>;
}

/** Indeterminate spinner (`role="status"`). Give it a name with `aria-label`. */
export function ProgressSpinner({ className, ...rest }: ProgressSpinnerProps) {
  return (
    <div {...rest} role="status" aria-busy="true" className={cx('tumaet-ui-progress-spinner', className)}>
      <svg className="tumaet-ui-progress-spinner-spin" viewBox="25 25 50 50" aria-hidden="true" focusable="false">
        <circle
          className="tumaet-ui-progress-spinner-circle"
          cx="50"
          cy="50"
          r="20"
          fill="none"
          strokeWidth="2"
          strokeMiterlimit="10"
        />
      </svg>
    </div>
  );
}
