import type { HTMLAttributes, ReactNode, Ref } from 'react';
import { cx } from '../../internal/cx';
import { useTranslate } from '../../internal/i18n';
import { XIcon } from '../../internal/icons';

export type MessageSeverity = 'info' | 'success' | 'warn' | 'error' | 'secondary' | 'contrast';

export interface MessageProps extends HTMLAttributes<HTMLDivElement> {
  severity?: MessageSeverity;
  /** Decorative leading icon. */
  icon?: ReactNode;
  /** Shows a dismiss button. The message does not hide itself: remove it in `onDismiss`. */
  dismissible?: boolean;
  /** Accessible name of the dismiss button; defaults to the translated "Dismiss". */
  dismissLabel?: string;
  onDismiss?: () => void;
  ref?: Ref<HTMLDivElement>;
}

export function Message({
  severity = 'info',
  icon,
  dismissible,
  dismissLabel,
  onDismiss,
  className,
  children,
  role,
  ...rest
}: MessageProps) {
  const t = useTranslate();
  return (
    <div
      {...rest}
      role={role ?? (severity === 'error' ? 'alert' : 'status')}
      data-severity={severity}
      className={cx('tumaet-ui-message', className)}
    >
      <div className="tumaet-ui-message-content">
        {icon && (
          <span className="tumaet-ui-message-icon" aria-hidden="true">
            {icon}
          </span>
        )}
        <span className="tumaet-ui-message-text">{children}</span>
        {dismissible && (
          <button
            type="button"
            className="tumaet-ui-message-dismiss"
            aria-label={dismissLabel ?? t('tumAetUi.message.dismiss')}
            onClick={() => onDismiss?.()}
          >
            <XIcon />
          </button>
        )}
      </div>
    </div>
  );
}
