import {
  cloneElement,
  useCallback,
  useId,
  useMemo,
  useRef,
  type AnchorHTMLAttributes,
  type ButtonHTMLAttributes,
  type FocusEvent,
  type HTMLAttributes,
  type KeyboardEvent,
  type MouseEvent,
  type ReactElement,
  type ReactNode,
  type Ref,
} from 'react';
import { cx } from '../../internal/cx';
import { Floating, type Placement } from '../../internal/floating';
import { mergeRefs } from '../../internal/merge-refs';
import { useControllable } from '../../internal/use-controllable';

type TriggerProps = HTMLAttributes<HTMLElement> & { ref?: Ref<HTMLElement>; id?: string; disabled?: boolean };

export interface MenuProps extends Omit<HTMLAttributes<HTMLDivElement>, 'children'> {
  /** The menu button, usually a `Button`. It must accept a ref and DOM props. */
  trigger: ReactElement<TriggerProps>;
  /** Controlled open state. */
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  placement?: Placement;
  /** `MenuItem` entries. */
  children?: ReactNode;
  ref?: Ref<HTMLDivElement>;
}

const ITEMS = '[role="menuitem"]';
const TYPEAHEAD_RESET_MS = 500;

/**
 * Menu button pattern: the trigger opens a `role="menu"` of `MenuItem` entries (actions or links). Arrow keys, Home, End
 * and type-ahead move focus; Escape closes the menu and returns focus to the trigger; so does choosing an entry or Tab.
 * Use `Popover` for rich or non-action content.
 */
export function Menu({
  trigger,
  open,
  defaultOpen = false,
  onOpenChange,
  placement = 'bottom-start',
  className,
  children,
  ref,
  onKeyDown,
  onBlur,
  ...rest
}: MenuProps) {
  const [isOpen, setOpen] = useControllable(open, defaultOpen, onOpenChange);
  const menuId = useId();
  const generatedTriggerId = useId();
  const triggerId = trigger.props.id ?? generatedTriggerId;
  const anchor = useRef<HTMLElement | null>(null);
  const triggerRef = trigger.props.ref;
  const mergedTriggerRef = useMemo(() => mergeRefs<HTMLElement>(triggerRef, anchor), [triggerRef]);
  const initialFocus = useRef<'first' | 'last'>('first');
  const focusedPanel = useRef<HTMLDivElement | null>(null);
  const typed = useRef({ text: '', timer: undefined as ReturnType<typeof setTimeout> | undefined });

  const closeAndFocus = () => {
    setOpen(false);
    anchor.current?.focus();
  };

  // Floating passes a fresh ref callback on every render: only the first call for a panel element moves focus.
  const focusPanel = useCallback((node: HTMLDivElement | null) => {
    if (!node || node === focusedPanel.current) return;
    focusedPanel.current = node;
    const items = Array.from(node.querySelectorAll<HTMLElement>(ITEMS));
    (initialFocus.current === 'last' ? items[items.length - 1] : (items[0] ?? node))?.focus({ preventScroll: true });
    if (items.length === 0) node.focus({ preventScroll: true });
  }, []);

  const openWith = (which: 'first' | 'last') => {
    initialFocus.current = which;
    setOpen(true);
  };

  const handleMenuKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    onKeyDown?.(event);
    if (event.defaultPrevented) return;
    const items = Array.from(event.currentTarget.querySelectorAll<HTMLElement>(ITEMS));
    const current = items.indexOf(document.activeElement as HTMLElement);
    const focusAt = (index: number) => {
      event.preventDefault();
      items[(index + items.length) % items.length]?.focus();
    };
    switch (event.key) {
      case 'ArrowDown':
        return focusAt(current + 1);
      case 'ArrowUp':
        return focusAt(current < 0 ? items.length - 1 : current - 1);
      case 'Home':
        return focusAt(0);
      case 'End':
        return focusAt(items.length - 1);
      case 'Tab':
        // Leave the menu and let the browser continue from the trigger.
        if (!event.altKey && !event.ctrlKey && !event.metaKey) closeAndFocus();
        return;
    }
    if (event.key.length === 1 && event.key !== ' ' && !event.altKey && !event.ctrlKey && !event.metaKey) {
      const state = typed.current;
      clearTimeout(state.timer);
      state.text += event.key.toLowerCase();
      state.timer = setTimeout(() => (state.text = ''), TYPEAHEAD_RESET_MS);
      // A repeated single letter cycles through the entries that start with it.
      const cycling = state.text.length > 1 && [...state.text].every((c) => c === state.text[0]);
      const term = cycling ? state.text[0]! : state.text;
      const ordered = [
        ...items.slice(current + (cycling || state.text.length === 1 ? 1 : 0)),
        ...items.slice(0, current + (cycling || state.text.length === 1 ? 1 : 0)),
      ];
      const match = ordered.find((item) => item.textContent?.trim().toLowerCase().startsWith(term));
      if (match) {
        event.preventDefault();
        match.focus();
      }
    }
  };

  const handleBlur = (event: FocusEvent<HTMLDivElement>) => {
    onBlur?.(event);
    const next = event.relatedTarget;
    // Focus moved elsewhere in the page: close without stealing it back. A null target (window blur) keeps the menu open.
    if (next instanceof Node && !event.currentTarget.contains(next) && !anchor.current?.contains(next)) setOpen(false);
  };

  return (
    <>
      {cloneElement(trigger, {
        ref: mergedTriggerRef,
        id: triggerId,
        'aria-haspopup': 'menu',
        'aria-expanded': isOpen,
        'aria-controls': isOpen ? menuId : undefined,
        onClick: (event: MouseEvent<HTMLElement>) => {
          trigger.props.onClick?.(event);
          if (event.defaultPrevented) return;
          if (isOpen) setOpen(false);
          else openWith('first');
        },
        onKeyDown: (event: KeyboardEvent<HTMLElement>) => {
          trigger.props.onKeyDown?.(event);
          if (event.defaultPrevented) return;
          // Enter and Space reach onClick through the native button.
          if (event.key === 'ArrowDown') {
            event.preventDefault();
            openWith('first');
          } else if (event.key === 'ArrowUp') {
            event.preventDefault();
            openWith('last');
          }
        },
      })}
      <Floating
        {...rest}
        ref={mergeRefs<HTMLDivElement>(ref, focusPanel)}
        anchor={anchor}
        open={isOpen}
        placement={placement}
        onDismiss={closeAndFocus}
        id={menuId}
        role="menu"
        aria-labelledby={rest['aria-labelledby'] ?? (rest['aria-label'] ? undefined : triggerId)}
        tabIndex={-1}
        style={{ visibility: 'visible', ...rest.style }}
        className={cx('tumaet-ui-menu', className)}
        onKeyDown={handleMenuKeyDown}
        onBlur={handleBlur}
        // Choosing an entry closes the menu and hands focus back to the trigger.
        onClick={(event) => {
          rest.onClick?.(event);
          const item = (event.target as Element).closest(ITEMS);
          if (item && item.getAttribute('aria-disabled') !== 'true') closeAndFocus();
        }}
      >
        {children}
      </Floating>
    </>
  );
}

type CommonItemProps = { disabled?: boolean; icon?: ReactNode };
type ButtonItemProps = CommonItemProps &
  Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'disabled'> & { href?: undefined; ref?: Ref<HTMLButtonElement> };
type LinkItemProps = CommonItemProps &
  Omit<AnchorHTMLAttributes<HTMLAnchorElement>, 'href'> & { href: string; ref?: Ref<HTMLAnchorElement> };
export type MenuItemProps = ButtonItemProps | LinkItemProps;

/**
 * A command (`<button>`) or, with `href`, a navigation entry (`<a>`) inside a `Menu`. `onClick` fires for a click,
 * Enter or Space and never while `disabled`. A disabled entry stays focusable so arrow keys still find it.
 */
export function MenuItem({ disabled, icon, className, children, onClick, ...rest }: MenuItemProps) {
  const common = {
    role: 'menuitem' as const,
    tabIndex: -1,
    'aria-disabled': disabled || undefined,
    className: cx('tumaet-ui-menu-item', className),
  };
  const handleClick = (event: MouseEvent<never>) => {
    if (disabled) {
      event.preventDefault();
      return;
    }
    (onClick as ((e: MouseEvent<never>) => void) | undefined)?.(event);
  };
  if ('href' in rest && rest.href !== undefined) {
    const { ref, ...anchorProps } = rest as LinkItemProps;
    return (
      <a {...anchorProps} {...common} ref={ref} onClick={handleClick}>
        {icon}
        {children}
      </a>
    );
  }
  const { ref, ...buttonProps } = rest as ButtonItemProps;
  return (
    <button type="button" {...buttonProps} {...common} ref={ref} onClick={handleClick}>
      {icon}
      {children}
    </button>
  );
}
