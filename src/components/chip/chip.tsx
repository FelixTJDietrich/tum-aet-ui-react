import type { HTMLAttributes, KeyboardEvent, MouseEvent, ReactNode, Ref } from 'react';
import { cx } from '../../internal/cx';
import { useTranslate } from '../../internal/i18n';
import { XIcon } from '../../internal/icons';

export type ChipSize = 'small';

export interface ChipProps extends Omit<HTMLAttributes<HTMLSpanElement>, 'onKeyDown'> {
  /** Text of the chip; `children` are used when it is not set. */
  label?: string;
  /** Shows a remove button at the end of the chip. The chip does not hide itself: remove it in `onRemove`. */
  removable?: boolean;
  /** `small` is the compact chip; leave unset for the default size. */
  size?: ChipSize;
  /** Accessible name of the remove button; defaults to the translated "Remove". */
  removeLabel?: string;
  /** Fires when the remove button is clicked or activated with Backspace or Delete. */
  onRemove?: (event: MouseEvent<HTMLButtonElement> | KeyboardEvent<HTMLButtonElement>) => void;
  ref?: Ref<HTMLSpanElement>;
  children?: ReactNode;
}

export function Chip({ label, removable, size, removeLabel, onRemove, className, children, ...rest }: ChipProps) {
  const t = useTranslate();
  return (
    <span
      {...rest}
      data-size={size}
      data-removable={removable === true ? true : undefined}
      className={cx('tumaet-ui-chip', className)}
    >
      <span className="tumaet-ui-chip-label">{label !== undefined && label !== '' ? label : children}</span>
      {removable === true ? (
        <button
          type="button"
          className="tumaet-ui-chip-remove"
          aria-label={removeLabel ?? t('tumAetUi.chip.remove')}
          onClick={(event) => onRemove?.(event)}
          onKeyDown={(event) => {
            if (event.key === 'Backspace' || event.key === 'Delete') {
              event.preventDefault();
              onRemove?.(event);
            }
          }}
        >
          <XIcon />
        </button>
      ) : null}
    </span>
  );
}
