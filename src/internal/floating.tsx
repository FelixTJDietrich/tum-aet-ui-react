import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
  type HTMLAttributes,
  type ReactNode,
  type RefObject,
} from 'react';
import { createPortal } from 'react-dom';
import { cx } from './cx';

export type Side = 'top' | 'bottom' | 'left' | 'right';
export type Placement = Side | `${Side}-start` | `${Side}-end`;

interface Box {
  top: number;
  left: number;
  width: number;
  height: number;
}

/** Pure positioning: places `floating` next to `anchor`, flips to the opposite side when it does not fit and keeps it inside the viewport. */
export function computePosition(
  anchor: Box,
  floating: { width: number; height: number },
  placement: Placement,
  viewport: { width: number; height: number },
  offset = 4,
): { top: number; left: number; side: Side } {
  const [wanted, align = 'center'] = placement.split('-') as [Side, ('start' | 'end')?];
  const fits = (side: Side) => {
    switch (side) {
      case 'bottom':
        return anchor.top + anchor.height + offset + floating.height <= viewport.height;
      case 'top':
        return anchor.top - offset - floating.height >= 0;
      case 'right':
        return anchor.left + anchor.width + offset + floating.width <= viewport.width;
      case 'left':
        return anchor.left - offset - floating.width >= 0;
    }
  };
  const opposite: Record<Side, Side> = { top: 'bottom', bottom: 'top', left: 'right', right: 'left' };
  const side = fits(wanted) || !fits(opposite[wanted]) ? wanted : opposite[wanted];
  let top: number;
  let left: number;
  if (side === 'top' || side === 'bottom') {
    top = side === 'bottom' ? anchor.top + anchor.height + offset : anchor.top - offset - floating.height;
    left =
      align === 'start'
        ? anchor.left
        : align === 'end'
          ? anchor.left + anchor.width - floating.width
          : anchor.left + (anchor.width - floating.width) / 2;
    left = Math.max(4, Math.min(left, viewport.width - floating.width - 4));
  } else {
    left = side === 'right' ? anchor.left + anchor.width + offset : anchor.left - offset - floating.width;
    top =
      align === 'start'
        ? anchor.top
        : align === 'end'
          ? anchor.top + anchor.height - floating.height
          : anchor.top + (anchor.height - floating.height) / 2;
    top = Math.max(4, Math.min(top, viewport.height - floating.height - 4));
  }
  return { top, left, side };
}

export interface FloatingProps extends Omit<HTMLAttributes<HTMLDivElement>, 'children'> {
  /** Element the panel is placed next to. Clicks on it do not count as outside clicks. */
  anchor: RefObject<HTMLElement | null>;
  open: boolean;
  placement?: Placement;
  offset?: number;
  /** Gives the panel at least the width of the anchor. */
  matchWidth?: boolean;
  /** Called on Escape and on a pointer press outside the panel and the anchor. */
  onDismiss?: () => void;
  children?: ReactNode;
}

/**
 * Portal-rendered, viewport-aware panel for popovers, menus, select lists and tooltips.
 * Renders nothing while closed. Focus handling is up to the caller.
 */
export function Floating({
  anchor,
  open,
  placement = 'bottom-start',
  offset = 4,
  matchWidth,
  onDismiss,
  className,
  style,
  children,
  ref,
  ...rest
}: FloatingProps & { ref?: React.Ref<HTMLDivElement> }) {
  const panel = useRef<HTMLDivElement | null>(null);
  const [pos, setPos] = useState<{ top: number; left: number; side: Side } | null>(null);
  const [minWidth, setMinWidth] = useState<number | undefined>();
  const dismiss = useRef(onDismiss);
  dismiss.current = onDismiss;

  const update = useCallback(() => {
    const a = anchor.current;
    const p = panel.current;
    if (!a || !p) return;
    const r = a.getBoundingClientRect();
    setMinWidth(matchWidth ? r.width : undefined);
    const f = p.getBoundingClientRect();
    setPos(
      computePosition(
        { top: r.top, left: r.left, width: r.width, height: r.height },
        { width: f.width, height: f.height },
        placement,
        { width: window.innerWidth, height: window.innerHeight },
        offset,
      ),
    );
  }, [anchor, matchWidth, placement, offset]);

  useLayoutEffect(() => {
    if (!open) {
      setPos(null);
      return;
    }
    update();
  }, [open, update, children]);

  useEffect(() => {
    if (!open) return;
    const onScroll = () => update();
    window.addEventListener('resize', onScroll);
    window.addEventListener('scroll', onScroll, true);
    const onPointerDown = (event: PointerEvent) => {
      const target = event.target as Node;
      if (panel.current?.contains(target) || anchor.current?.contains(target)) return;
      dismiss.current?.();
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.stopPropagation();
        dismiss.current?.();
      }
    };
    document.addEventListener('pointerdown', onPointerDown, true);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      window.removeEventListener('resize', onScroll);
      window.removeEventListener('scroll', onScroll, true);
      document.removeEventListener('pointerdown', onPointerDown, true);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [open, update, anchor]);

  if (!open) return null;
  // A modal dialog sits in the top layer, above everything in <body>, so popups opened inside it are portalled into it.
  const container = anchor.current?.closest('dialog') ?? document.body;
  const css: CSSProperties = {
    position: 'fixed',
    top: pos?.top ?? 0,
    left: pos?.left ?? 0,
    minWidth,
    // Invisible but focusable until positioned: `visibility: hidden` would make `autoFocus` inside the panel fail in browsers.
    ...(pos ? null : { opacity: 0, pointerEvents: 'none' as const }),
    ...style,
  };
  return createPortal(
    <div
      {...rest}
      ref={(node) => {
        panel.current = node;
        if (typeof ref === 'function') ref(node);
        else if (ref) ref.current = node;
      }}
      className={cx('tumaet-ui-overlay', className)}
      data-side={pos?.side}
      style={css}
    >
      {children}
    </div>,
    container,
  );
}
