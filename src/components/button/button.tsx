import type { ButtonHTMLAttributes, ReactNode, Ref } from 'react';
import { cx } from '../../internal/cx';
import { SpinnerIcon } from '../../internal/icons';

export type ButtonSeverity = 'primary' | 'secondary' | 'success' | 'info' | 'warn' | 'danger' | 'contrast';
export type ButtonSize = 'small' | 'default' | 'large';
export type ButtonVariant = 'solid' | 'outlined' | 'text';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  severity?: ButtonSeverity;
  size?: ButtonSize;
  variant?: ButtonVariant;
  rounded?: boolean;
  /** Replaces the icon with a spinner and disables the button. */
  loading?: boolean;
  /** Leading icon. Decorative, so give icon-only buttons an `aria-label`. */
  icon?: ReactNode;
  ref?: Ref<HTMLButtonElement>;
}

export function Button({ severity = 'primary', size = 'default', variant = 'solid', rounded, loading, icon, type = 'button', disabled, className, children, ...rest }: ButtonProps) {
  return (
    <button
      {...rest}
      type={type}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      data-severity={severity}
      data-size={size}
      data-variant={variant}
      className={cx('tumaet-ui-btn', rounded && 'tumaet-ui-btn-rounded', className)}
    >
      {loading ? <SpinnerIcon /> : icon}
      {children}
    </button>
  );
}

/** Class names for styling a native `<a>` or other element like a button. */
export function buttonClassName({ rounded }: { rounded?: boolean } = {}): string {
  return cx('tumaet-ui-btn', rounded && 'tumaet-ui-btn-rounded');
}
