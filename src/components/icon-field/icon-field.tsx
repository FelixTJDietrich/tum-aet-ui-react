import type { HTMLAttributes, ReactNode, Ref } from 'react';
import { cx } from '../../internal/cx';

export type IconFieldPosition = 'left' | 'right';

export interface IconFieldProps extends HTMLAttributes<HTMLDivElement> {
  /** Decorative icon shown inside the field. */
  icon?: ReactNode;
  /** Side of the field the icon sits on. The input gets matching padding. Follows the writing direction (RTL flips it). */
  iconPosition?: IconFieldPosition;
  ref?: Ref<HTMLDivElement>;
}

/** Wraps an `Input` and overlays a decorative icon at its start or end. */
export function IconField({ icon, iconPosition = 'left', className, children, ...rest }: IconFieldProps) {
  // Keeps the falsy semantics of ReactNode (`''`, `0`, `false` render no icon).
  const hasIcon = Boolean(icon);
  return (
    <div
      {...rest}
      className={cx('tumaet-ui-icon-field', className)}
      data-position={iconPosition}
      data-has-icon={hasIcon ? '' : undefined}
    >
      {hasIcon ? (
        <span className="tumaet-ui-input-icon" aria-hidden="true">
          {icon}
        </span>
      ) : null}
      {children}
    </div>
  );
}
