import {
  cloneElement,
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  type CSSProperties,
  type FocusEvent,
  type KeyboardEvent,
  type PointerEvent,
  type ReactElement,
  type ReactNode,
  type Ref,
} from 'react';
import { Floating, type Placement } from '../../internal/floating';
import { mergeRefs } from '../../internal/merge-refs';

interface HostProps {
  ref?: Ref<HTMLElement>;
  'aria-describedby'?: string;
  onPointerEnter?: (event: PointerEvent<HTMLElement>) => void;
  onPointerLeave?: (event: PointerEvent<HTMLElement>) => void;
  onPointerDown?: (event: PointerEvent<HTMLElement>) => void;
  onFocus?: (event: FocusEvent<HTMLElement>) => void;
  onBlur?: (event: FocusEvent<HTMLElement>) => void;
  onKeyDown?: (event: KeyboardEvent<HTMLElement>) => void;
}

export interface TooltipProps {
  /** A plain hint, several items (rendered as a bulleted list) or any non-interactive node. Nothing is shown when empty. */
  content: ReactNode | readonly string[];
  placement?: Placement;
  /**
   * Whether the tooltip adds itself to the host's `aria-describedby` while open. Turn this off on a host that is already
   * described by permanent markup with the same text, so the description is not announced twice.
   */
  describesHost?: boolean;
  /** Delay before showing, in milliseconds. */
  showDelay?: number;
  /** Delay before hiding, in milliseconds. */
  hideDelay?: number;
  /** The host element. It must accept a ref and DOM event props. */
  children: ReactElement<HostProps>;
}

/** How close the arrow may get to a corner of the bubble. */
const ARROW_EDGE_INSET_PX = 12;

const isList = (content: TooltipProps['content']): content is readonly string[] => Array.isArray(content);
const isEmpty = (content: TooltipProps['content']) =>
  content === null ||
  content === undefined ||
  content === false ||
  content === '' ||
  (isList(content) && content.length === 0);

/** Keys that stay unique for repeated items without being the bare position in the list. */
function uniqueKeys(items: readonly string[]): string[] {
  const seen = new Map<string, number>();
  return items.map((item) => {
    const count = seen.get(item) ?? 0;
    seen.set(item, count + 1);
    return `${item}\u0000${count}`;
  });
}

/** Points the arrow at the host rather than at the middle of the bubble, which the viewport clamping may have shifted. */
function Arrow({ anchor }: { anchor: React.RefObject<HTMLElement | null> }) {
  const arrow = useRef<HTMLSpanElement>(null);
  const [style, setStyle] = useState<CSSProperties>();
  useEffect(() => {
    const measure = () => {
      const bubble = arrow.current?.parentElement;
      const host = anchor.current;
      if (!bubble || !host) return;
      const hostRect = host.getBoundingClientRect();
      const bubbleRect = bubble.getBoundingClientRect();
      const horizontal = bubble.dataset.side === 'top' || bubble.dataset.side === 'bottom';
      const length = horizontal ? bubbleRect.width : bubbleRect.height;
      // A zero-sized bubble has not been laid out yet.
      if (length === 0) return;
      const centre = horizontal
        ? hostRect.left + hostRect.width / 2 - bubbleRect.left
        : hostRect.top + hostRect.height / 2 - bubbleRect.top;
      const offset = Math.min(Math.max(centre, ARROW_EDGE_INSET_PX), length - ARROW_EDGE_INSET_PX);
      setStyle(horizontal ? { left: offset } : { top: offset });
    };
    // After Floating has placed the bubble.
    const frame = requestAnimationFrame(measure);
    window.addEventListener('resize', measure);
    window.addEventListener('scroll', measure, true);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener('resize', measure);
      window.removeEventListener('scroll', measure, true);
    };
  }, [anchor]);
  return <span ref={arrow} className="tumaet-ui-tooltip-arrow" aria-hidden="true" style={style} />;
}

/**
 * Hint shown on hover and keyboard focus of its child and linked to it through `aria-describedby`.
 * Escape dismisses it, a press on the child hides it, and touch interaction never shows it.
 */
export function Tooltip({
  content,
  placement = 'top',
  describesHost = true,
  showDelay = 150,
  hideDelay = 100,
  children,
}: TooltipProps) {
  const id = useId();
  const [open, setOpen] = useState(false);
  const anchor = useRef<HTMLElement | null>(null);
  const bubble = useRef<HTMLDivElement | null>(null);
  const state = useRef({ hovered: false, tooltipHovered: false, focused: false, pointerFocus: false });
  const showTimer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const hideTimer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const userHostRef = children.props.ref;
  const mergedRef = useCallback(
    (node: HTMLElement | null) => {
      anchor.current = node;
      return mergeRefs<HTMLElement>(userHostRef)(node);
    },
    [userHostRef],
  );
  const empty = isEmpty(content);
  const visible = open && !empty;

  const clearTimers = useCallback(() => {
    clearTimeout(showTimer.current);
    clearTimeout(hideTimer.current);
  }, []);
  const hideNow = useCallback(() => {
    clearTimers();
    state.current.tooltipHovered = false;
    setOpen(false);
  }, [clearTimers]);
  const scheduleShow = () => {
    clearTimers();
    if (visible || empty) return;
    showTimer.current = setTimeout(() => setOpen(true), showDelay);
  };
  const scheduleHideIfInactive = useCallback(() => {
    const s = state.current;
    if (s.hovered || s.tooltipHovered || s.focused) return;
    clearTimers();
    hideTimer.current = setTimeout(hideNow, hideDelay);
  }, [clearTimers, hideNow, hideDelay]);

  useEffect(() => clearTimers, [clearTimers]);

  useEffect(() => {
    if (!visible) return;
    const s = state.current;
    // The bubble ignores the pointer so clicks reach controls beneath it; geometric hover keeps it open while the
    // pointer travels from the host onto it.
    const onMove = (event: globalThis.PointerEvent) => {
      const rect = bubble.current?.getBoundingClientRect();
      if (!rect || (rect.width === 0 && rect.height === 0)) return;
      const hovered =
        event.clientX >= rect.left &&
        event.clientX <= rect.right &&
        event.clientY >= rect.top &&
        event.clientY <= rect.bottom;
      if (hovered === s.tooltipHovered) return;
      s.tooltipHovered = hovered;
      if (hovered) clearTimeout(hideTimer.current);
      else scheduleHideIfInactive();
    };
    // The pointer left the page: nothing is hovered any more, so the tooltip must not stay open on its last position.
    const onPageLeave = () => {
      s.hovered = false;
      s.tooltipHovered = false;
      scheduleHideIfInactive();
    };
    const onWindowBlur = () => hideNow();
    document.addEventListener('pointermove', onMove);
    document.addEventListener('pointerleave', onPageLeave);
    document.documentElement.addEventListener('pointerleave', onPageLeave);
    window.addEventListener('blur', onWindowBlur);
    return () => {
      document.removeEventListener('pointermove', onMove);
      document.removeEventListener('pointerleave', onPageLeave);
      document.documentElement.removeEventListener('pointerleave', onPageLeave);
      window.removeEventListener('blur', onWindowBlur);
    };
  }, [visible, hideNow, scheduleHideIfInactive]);

  const props = children.props;
  const describedBy =
    [props['aria-describedby'], visible && describesHost ? id : undefined].filter(Boolean).join(' ') || undefined;
  // eslint-disable-next-line react-hooks/refs -- the handlers and the merged ref callback only touch refs when React attaches the element or an event fires, never during render
  const host = cloneElement(children, {
    ref: mergedRef,
    'aria-describedby': describedBy,
    onPointerEnter: (event) => {
      props.onPointerEnter?.(event);
      if (event.pointerType === 'touch') return;
      state.current.hovered = true;
      scheduleShow();
    },
    onPointerLeave: (event) => {
      props.onPointerLeave?.(event);
      state.current.hovered = false;
      // A touch tap leaves the pointer before the browser moves focus, so its flag has to survive until the blur.
      if (event.pointerType !== 'touch') state.current.pointerFocus = false;
      scheduleHideIfInactive();
    },
    onPointerDown: (event) => {
      props.onPointerDown?.(event);
      // Focus that comes from a click or tap must not hold the tooltip open or show it.
      state.current.pointerFocus = true;
      hideNow();
    },
    onFocus: (event) => {
      props.onFocus?.(event);
      if (state.current.pointerFocus) return;
      state.current.focused = true;
      scheduleShow();
    },
    onBlur: (event) => {
      props.onBlur?.(event);
      state.current.focused = false;
      state.current.pointerFocus = false;
      scheduleHideIfInactive();
    },
    onKeyDown: (event) => {
      props.onKeyDown?.(event);
      if (event.key === 'Escape') hideNow();
    },
  });

  const itemKeys = isList(content) ? uniqueKeys(content) : [];

  return (
    <>
      {host}
      <Floating
        ref={bubble}
        anchor={anchor}
        open={visible}
        placement={placement}
        offset={8}
        onDismiss={hideNow}
        id={id}
        role="tooltip"
        className="tumaet-ui-tooltip-bubble"
        data-variant={isList(content) || (typeof content !== 'string' && typeof content !== 'number') ? 'list' : 'text'}
      >
        {isList(content) ? (
          <ul>
            {content.map((item, index) => (
              <li key={itemKeys[index]}>{item}</li>
            ))}
          </ul>
        ) : (
          content
        )}
        <Arrow anchor={anchor} />
      </Floating>
    </>
  );
}
