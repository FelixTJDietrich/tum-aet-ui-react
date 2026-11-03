import { useId, useLayoutEffect, useRef, type DialogHTMLAttributes, type ReactNode, type Ref } from 'react';
import { cx } from '../../internal/cx';
import { XIcon } from '../../internal/icons';
import { useTranslate } from '../../internal/i18n';
import { useControllable } from '../../internal/use-controllable';

export type DialogSize = 'small' | 'medium' | 'large' | 'full';

export interface DialogProps extends Omit<
  DialogHTMLAttributes<HTMLDialogElement>,
  'open' | 'role' | 'autoFocus' | 'onClose' | 'onCancel' | 'children'
> {
  /** Controlled open state. */
  open?: boolean;
  /** Initial open state when `open` is not given (uncontrolled). */
  defaultOpen?: boolean;
  /** Called with `false` when the user dismisses the dialog (close button, Escape, mask click) and the parent should close it. */
  onOpenChange?: (open: boolean) => void;
  /** Called after the dialog was opened. */
  onShow?: () => void;
  /** Called after the dialog was closed. */
  onHide?: () => void;
  /** Visible title and default accessible name. */
  header?: ReactNode;
  /** Hides the header (and with it the close button); an `aria-label` is then required. */
  showHeader?: boolean;
  /** Shows the close button without changing Escape or mask behaviour. */
  closable?: boolean;
  /** Allows Escape to close the dialog. */
  closeOnEscape?: boolean;
  /** Allows a click on the backdrop to close the dialog. */
  dismissableMask?: boolean;
  /** Responsive dimensions. Omit for a content-sized dialog. */
  size?: DialogSize;
  /** Overrides the translated label of the close button. */
  closeButtonAriaLabel?: string;
  /** `alertdialog` for a decision that interrupts the user. */
  role?: 'dialog' | 'alertdialog';
  /** Initial focus target. `'dialog'` keeps long content at its starting scroll position. */
  autoFocus?: 'dialog' | 'first-tabbable';
  /** Rendered in the footer, usually buttons. The footer is omitted without it. */
  footer?: ReactNode;
  children?: ReactNode;
  ref?: Ref<HTMLDialogElement>;
}

// Page scroll lock shared by all dialogs, counted so nested dialogs unlock only once the last one closes.
// Overflow plus a scrollbar-width pad holds the page exactly where it was (no `position: fixed` jump).
let openDialogCount = 0;
let previousRootOverflow = '';
let previousRootPaddingRight = '';

function lockPageScroll(): void {
  if (openDialogCount++ > 0) return;
  const root = document.documentElement;
  previousRootOverflow = root.style.overflow;
  previousRootPaddingRight = root.style.paddingRight;
  const scrollbarWidth = window.innerWidth - root.clientWidth;
  root.style.overflow = 'hidden';
  if (scrollbarWidth > 0) root.style.paddingRight = `${scrollbarWidth}px`;
}

function unlockPageScroll(): void {
  if (openDialogCount === 0 || --openDialogCount > 0) return;
  const root = document.documentElement;
  root.style.overflow = previousRootOverflow;
  root.style.paddingRight = previousRootPaddingRight;
}

/**
 * Modal dialog on the native `<dialog>` element: the platform provides the top layer, the focus trap,
 * inert background and focus return. Renders nothing while closed.
 */
export function Dialog({ open, defaultOpen = false, onOpenChange, ...props }: DialogProps) {
  const [isOpen, setOpen] = useControllable(open, defaultOpen, onOpenChange);
  if (!isOpen) return null;
  return <DialogSurface {...props} onRequestClose={() => setOpen(false)} />;
}

type SurfaceProps = Omit<DialogProps, 'open' | 'defaultOpen' | 'onOpenChange'> & { onRequestClose: () => void };

function DialogSurface({
  onRequestClose,
  onShow,
  onHide,
  header,
  showHeader = true,
  closable = true,
  closeOnEscape = true,
  dismissableMask = false,
  size,
  closeButtonAriaLabel,
  role = 'dialog',
  autoFocus = 'first-tabbable',
  footer,
  className,
  children,
  ref,
  ...rest
}: SurfaceProps) {
  const t = useTranslate();
  const titleId = useId();
  const element = useRef<HTMLDialogElement | null>(null);
  const closing = useRef(false);
  const pressedOnMask = useRef(false);
  const callbacks = useRef({ onShow, onHide });
  callbacks.current = { onShow, onHide };

  const hasHeader =
    showHeader && (typeof header === 'string' ? header.trim() !== '' : header != null && header !== false);
  const ariaLabel = rest['aria-label']?.trim();
  if (!hasHeader && !ariaLabel && !rest['aria-labelledby']) {
    throw new Error('Dialog requires a visible header or an aria-label');
  }

  useLayoutEffect(() => {
    const dialog = element.current;
    if (!dialog) return;
    closing.current = false;
    const opener = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    lockPageScroll();
    if (!dialog.open) dialog.showModal();
    if (autoFocus === 'dialog') dialog.focus({ preventScroll: true });
    callbacks.current.onShow?.();
    return () => {
      closing.current = true;
      if (dialog.open) dialog.close();
      unlockPageScroll();
      // The platform restores focus on close(); this covers a dialog that is removed while open.
      if (opener?.isConnected && document.activeElement !== opener) opener.focus();
      callbacks.current.onHide?.();
    };
    // Runs once per open: the dialog surface is only mounted while open.
  }, []);

  return (
    <dialog
      {...rest}
      ref={(node) => {
        element.current = node;
        if (typeof ref === 'function') return ref(node);
        if (ref) ref.current = node;
      }}
      role={role === 'dialog' ? undefined : role}
      aria-labelledby={rest['aria-labelledby'] ?? (hasHeader ? titleId : undefined)}
      tabIndex={autoFocus === 'dialog' ? -1 : undefined}
      className={cx('tumaet-ui-dialog-modal', className)}
      onCancel={(event) => {
        // Escape (and the platform's close request): the parent owns the open state, so never let the browser close it.
        event.preventDefault();
        if (closeOnEscape) onRequestClose();
      }}
      onClose={(event) => {
        // Closed natively (for example by a `<form method="dialog">` inside): tell the parent. The event is queued by
        // the browser, so one caused by our own close() can arrive after the dialog was opened again (StrictMode
        // re-runs the effect): an open dialog was not closed.
        if (!closing.current && !event.currentTarget.open) onRequestClose();
      }}
      onKeyDown={(event) => {
        rest.onKeyDown?.(event);
        if (event.key !== 'Escape' || event.defaultPrevented) return;
        // Escape is handled here instead of through the browser's `cancel`, so it is the same in every browser (Chromium
        // closes a dialog natively on a repeated Escape even after `cancel` was prevented) and the topmost popup wins:
        // a menu, popover, select list or tooltip portalled into this dialog closes first and leaves the dialog open.
        event.preventDefault();
        if (closeOnEscape && !event.currentTarget.querySelector(':scope > .tumaet-ui-overlay')) onRequestClose();
      }}
      onPointerDown={(event) => {
        pressedOnMask.current = event.target === event.currentTarget;
        rest.onPointerDown?.(event);
      }}
      onClick={(event) => {
        // The panel fills the dialog element, so a click that targets the element itself hit the backdrop.
        // A drag that started inside the panel and ended on the backdrop does not count.
        if (dismissableMask && event.target === event.currentTarget && pressedOnMask.current) onRequestClose();
        rest.onClick?.(event);
      }}
    >
      <div className="tumaet-ui-dialog" data-size={size}>
        {showHeader && (
          <div className="tumaet-ui-dialog-header">
            <div id={titleId} className="tumaet-ui-dialog-title">
              {header}
            </div>
            {closable && (
              <button
                type="button"
                className="tumaet-ui-dialog-close"
                aria-label={closeButtonAriaLabel ?? t('tumAetUi.dialog.close')}
                onClick={onRequestClose}
              >
                <XIcon />
              </button>
            )}
          </div>
        )}
        <div className="tumaet-ui-dialog-content">{children}</div>
        {footer != null && footer !== false && <div className="tumaet-ui-dialog-footer">{footer}</div>}
      </div>
    </dialog>
  );
}
