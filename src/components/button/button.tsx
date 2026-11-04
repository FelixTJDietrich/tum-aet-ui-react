import type { ButtonHTMLAttributes, ReactNode, Ref } from 'react';
import { cx } from '../../internal/cx';
import { SpinnerIcon } from '../../internal/icons';

export type ButtonSeverity = 'primary' | 'secondary' | 'success' | 'info' | 'warn' | 'danger' | 'contrast';
export type ButtonSize = 'small' | 'default' | 'large';
export type ButtonVariant = 'solid' | 'outlined' | 'text';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  /** Colour role of the button. */
  severity?: ButtonSeverity;
  size?: ButtonSize;
  /** `solid` fills, `outlined` draws a border only, `text` has neither. */
  variant?: ButtonVariant;
  /** Fully rounded (pill) corners, for icon-only buttons. */
  rounded?: boolean;
  /** Replaces the icon with a spinner and disables the button. */
  loading?: boolean;
  /** Leading icon. Decorative, so give icon-only buttons an `aria-label`. */
  icon?: ReactNode;
  ref?: Ref<HTMLButtonElement>;
}

export function Button({
  severity = 'primary',
  size = 'default',
  variant = 'solid',
  rounded,
  loading,
  icon,
  type = 'button',
  disabled,
  className,
  children,
  ...rest
}: ButtonProps) {
  return (
    <button
      {...rest}
      // eslint-disable-next-line react/button-has-type -- `type` is a caller-supplied union that defaults to 'button'
      type={type}
      disabled={disabled === true || loading === true}
      aria-busy={loading === true ? true : undefined}
      data-severity={severity}
      data-size={size}
      data-variant={variant}
      className={cx('tumaet-ui-btn', rounded === true && 'tumaet-ui-btn-rounded', className)}
    >
      {loading === true ? <SpinnerIcon /> : icon}
      {children}
    </button>
  );
}

/** Class names for styling a native `<a>` or other element like a button. Pair with `buttonAttributes` for severity, size and variant. */
export function buttonClassName({ rounded }: { rounded?: boolean } = {}): string {
  return cx('tumaet-ui-btn', rounded === true && 'tumaet-ui-btn-rounded');
}

/**
 * Props that style a native `<a>` or any element like a `Button` (the counterpart of the Angular `tumAetUiButton` directive):
 * `<a href="/x" {...buttonAttributes({ variant: 'text' })}>Details</a>`.
 */
export function buttonAttributes({
  severity = 'primary',
  size = 'default',
  variant = 'solid',
  rounded,
}: Pick<ButtonProps, 'severity' | 'size' | 'variant' | 'rounded'> = {}) {
  return {
    className: buttonClassName({ rounded }),
    'data-severity': severity,
    'data-size': size,
    'data-variant': variant,
  } as const;
}
