import {
  cloneElement,
  useCallback,
  useId,
  useLayoutEffect,
  useMemo,
  useRef,
  type HTMLAttributes,
  type KeyboardEvent,
  type ReactElement,
  type ReactNode,
  type Ref,
} from 'react';
import { cx } from '../../internal/cx';
import { Floating, type Placement } from '../../internal/floating';
import { mergeRefs } from '../../internal/merge-refs';
import { useControllable } from '../../internal/use-controllable';

export type PopoverPadding = 'default' | 'none';

type TriggerProps = HTMLAttributes<HTMLElement> & { ref?: Ref<HTMLElement> };

export interface PopoverProps extends Omit<HTMLAttributes<HTMLDivElement>, 'children'> {
  /** The element that toggles the popover, usually a `Button`. It must accept a ref and DOM props. */
  trigger: ReactElement<TriggerProps>;
  /** Controlled open state. */
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  placement?: Placement;
  padding?: PopoverPadding;
  /** Accessible name of the `role="dialog"` panel. Required: a dialog must have a name. */
  'aria-label': string;
  children?: ReactNode;
  ref?: Ref<HTMLDivElement>;
}

const TABBABLE =
  'a[href], button:not([disabled]), input:not([disabled]):not([type="hidden"]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"]), summary';

function tabbables(root: HTMLElement): HTMLElement[] {
  return Array.from(root.querySelectorAll<HTMLElement>(TABBABLE)).filter((el) => !el.closest('[hidden], [inert]'));
}

/**
 * Anchored panel for rich or interactive content, toggled by its trigger. Use `Tooltip` for a short, non-interactive hint
 * and `Menu` for a list of commands. Focus moves into the panel on open, is kept inside while open and returns to the
 * trigger on close.
 */
export function Popover({
  trigger,
  open,
  defaultOpen = false,
  onOpenChange,
  placement = 'bottom',
  padding = 'default',
  className,
  children,
  ref,
  ...rest
}: PopoverProps) {
  const [isOpen, setOpen] = useControllable(open, defaultOpen, onOpenChange);
  const panelId = useId();
  const anchor = useRef<HTMLElement | null>(null);
  const triggerRef = trigger.props.ref;
  const mergedTriggerRef = useMemo(() => mergeRefs<HTMLElement>(triggerRef, anchor), [triggerRef]);

  const close = () => {
    setOpen(false);
    anchor.current?.focus();
  };

  // Stable, so it only runs when the panel mounts. The panel is made visible by the style below, so it can take focus
  // before Floating has measured it (it is positioned before the first paint either way).
  // Floating passes a fresh ref callback on every render, so remember which panel element already took focus.
  const focusedPanel = useRef<HTMLDivElement | null>(null);
  const focusPanel = useCallback((node: HTMLDivElement | null) => {
    if (!node || node === focusedPanel.current) return;
    focusedPanel.current = node;
    (tabbables(node)[0] ?? node).focus({ preventScroll: true });
  }, []);

  // Closed from outside (the parent sets `open` to false, a button inside the panel closes it): the panel that held focus
  // is gone and focus fell back to the body, so give it back to the trigger. A focus that already went somewhere else stays.
  useLayoutEffect(() => {
    if (!isOpen) return;
    return () => {
      const active = document.activeElement;
      if (!active || active === document.body) anchor.current?.focus();
    };
  }, [isOpen]);

  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    rest.onKeyDown?.(event);
    if (event.key !== 'Tab') return;
    const items = tabbables(event.currentTarget);
    const first = items[0];
    const last = items[items.length - 1];
    if (!first || !last) {
      event.preventDefault();
      return;
    }
    const active = document.activeElement;
    if (event.shiftKey && (active === first || active === event.currentTarget)) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && active === last) {
      event.preventDefault();
      first.focus();
    }
  };

  return (
    <>
      {cloneElement(trigger, {
        ref: mergedTriggerRef,
        'aria-haspopup': 'dialog',
        'aria-expanded': isOpen,
        'aria-controls': isOpen ? panelId : undefined,
        onClick: (event: React.MouseEvent<HTMLElement>) => {
          trigger.props.onClick?.(event);
          if (!event.defaultPrevented) setOpen(!isOpen);
        },
      })}
      <Floating
        {...rest}
        ref={mergeRefs<HTMLDivElement>(ref, focusPanel)}
        anchor={anchor}
        open={isOpen}
        placement={placement}
        offset={8}
        onDismiss={close}
        id={panelId}
        role="dialog"
        aria-modal="true"
        tabIndex={-1}
        style={{ visibility: 'visible', ...rest.style }}
        className={cx('tumaet-ui-popover-panel', className)}
        data-padding={padding}
        onKeyDown={onKeyDown}
      >
        {children}
      </Floating>
    </>
  );
}
