import {
  cloneElement,
  useCallback,
  useId,
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
  onKeyUp,
  onBlur,
  ...rest
}: MenuProps) {
  const [isOpen, setOpen] = useControllable(open, defaultOpen, onOpenChange);
  const menuId = useId();
  const generatedTriggerId = useId();
  const triggerId = trigger.props.id ?? generatedTriggerId;
  const anchor = useRef<HTMLElement | null>(null);
  const userTriggerRef = trigger.props.ref;
  const mergedTriggerRef = useCallback(
    (node: HTMLElement | null) => {
      anchor.current = node;
      return mergeRefs<HTMLElement>(userTriggerRef)(node);
    },
    [userTriggerRef],
  );
  const initialFocus = useRef<'first' | 'last'>('first');
  const focusedPanel = useRef<HTMLDivElement | null>(null);
  const spaceHandled = useRef(false);
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

  /** Moves focus to the entry whose label starts with what was typed. Returns whether one matched. */
  const typeahead = (char: string, items: HTMLElement[], current: number): boolean => {
    const state = typed.current;
    clearTimeout(state.timer);
    state.text += char.toLowerCase();
    state.timer = setTimeout(() => (state.text = ''), TYPEAHEAD_RESET_MS);
    // A repeated single letter cycles through the entries that start with it.
    const cycling = state.text.length > 1 && Array.from(state.text).every((c) => c === state.text.charAt(0));
    const term = cycling ? state.text.charAt(0) : state.text;
    const from = current + (cycling || state.text.length === 1 ? 1 : 0);
    const ordered = [...items.slice(from), ...items.slice(0, from)];
    const match = ordered.find((item) => item.textContent.trim().toLowerCase().startsWith(term));
    match?.focus();
    return match !== undefined;
  };

  const handleMenuKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    onKeyDown?.(event);
    spaceHandled.current = false;
    if (event.defaultPrevented) return;
    const items = Array.from(event.currentTarget.querySelectorAll<HTMLElement>(ITEMS));
    const current = items.indexOf(document.activeElement as HTMLElement);
    const focusAt = (index: number) => {
      event.preventDefault();
      items[(index + items.length) % items.length]?.focus();
    };
    switch (event.key) {
      case 'ArrowDown': {
        focusAt(current + 1);
        return;
      }
      case 'ArrowUp': {
        focusAt(current < 0 ? items.length - 1 : current - 1);
        return;
      }
      case 'Home': {
        focusAt(0);
        return;
      }
      case 'End': {
        focusAt(items.length - 1);
        return;
      }
      case 'Tab':
        // Leave the menu and let the browser continue from the trigger.
        if (!event.altKey && !event.ctrlKey && !event.metaKey) closeAndFocus();
        return;
    }
    if (event.altKey || event.ctrlKey || event.metaKey) return;
    if (event.key === ' ') {
      // A space inside a search ("add e") extends it instead of choosing the entry.
      if (typed.current.text !== '') {
        typeahead(' ', items, current);
        event.preventDefault();
        spaceHandled.current = true;
      } else if (items[current]?.tagName === 'A') {
        // A button is chosen natively; on a link the browser would scroll the page instead.
        event.preventDefault();
        spaceHandled.current = true;
        items[current].click();
      }
    } else if (event.key.length === 1 && typeahead(event.key, items, current)) {
      event.preventDefault();
    }
  };

  // Firefox decides on a button click from keyup, so a cancelled Space keydown has to be cancelled on keyup too.
  const handleMenuKeyUp = (event: KeyboardEvent<HTMLDivElement>) => {
    onKeyUp?.(event);
    if (event.key === ' ' && spaceHandled.current) {
      spaceHandled.current = false;
      event.preventDefault();
    }
  };

  const handleBlur = (event: FocusEvent<HTMLDivElement>) => {
    onBlur?.(event);
    const next = event.relatedTarget;
    // Focus moved elsewhere in the page: close without stealing it back. A null target (window blur) keeps the menu open.
    if (next instanceof Node && !event.currentTarget.contains(next) && anchor.current?.contains(next) !== true)
      setOpen(false);
  };

  return (
    <>
      {/* eslint-disable-next-line react-hooks/refs -- the merged callback ref only writes the anchor when React attaches the element, never during render */}
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
        // Angular's dropdown positions sit flush against the trigger.
        offset={0}
        onDismiss={closeAndFocus}
        id={menuId}
        role="menu"
        aria-labelledby={
          rest['aria-labelledby'] ??
          (rest['aria-label'] !== undefined && rest['aria-label'] !== '' ? undefined : triggerId)
        }
        tabIndex={-1}
        style={{ visibility: 'visible', ...rest.style }}
        className={cx('tumaet-ui-menu', className)}
        onKeyDown={handleMenuKeyDown}
        onKeyUp={handleMenuKeyUp}
        onBlur={handleBlur}
        // Choosing an entry closes the menu and hands focus back to the trigger.
        onClick={(event) => {
          rest.onClick?.(event);
          const item = (event.target as Element).closest(ITEMS);
          if (item !== null && item.getAttribute('aria-disabled') !== 'true') closeAndFocus();
        }}
      >
        {children}
      </Floating>
    </>
  );
}

interface CommonItemProps {
  disabled?: boolean;
  icon?: ReactNode;
}
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
    tabIndex: -1,
    'aria-disabled': disabled === true ? true : undefined,
    className: cx('tumaet-ui-menu-item', className),
  };
  const handleClick = (event: MouseEvent<never>) => {
    if (disabled === true) {
      event.preventDefault();
      return;
    }
    onClick?.(event);
  };
  if ('href' in rest && rest.href !== undefined) {
    const { ref, href, ...anchorProps } = rest as LinkItemProps;
    return (
      <a {...anchorProps} {...common} href={href} role="menuitem" ref={ref} onClick={handleClick}>
        {icon}
        {children}
      </a>
    );
  }
  const { ref, ...buttonProps } = rest as ButtonItemProps;
  return (
    <button type="button" {...buttonProps} {...common} role="menuitem" ref={ref} onClick={handleClick}>
      {icon}
      {children}
    </button>
  );
}
