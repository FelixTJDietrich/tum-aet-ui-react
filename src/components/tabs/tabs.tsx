import type { HTMLAttributes, KeyboardEvent, ButtonHTMLAttributes, Ref } from 'react';
import { useCallback, useEffect, useId, useLayoutEffect, useRef, useState } from 'react';
import { cx } from '../../internal/cx';
import { mergeRefs } from '../../internal/merge-refs';
import { useControllable } from '../../internal/use-controllable';
import {
  TabsContext,
  idPart,
  resolveActiveValue,
  sortTabs,
  tabKey,
  useTabsContext,
  type TabEntry,
  type TabValue,
} from './tabs-context';

export interface TabsProps extends Omit<HTMLAttributes<HTMLDivElement>, 'onChange' | 'defaultValue'> {
  /** Value of the selected tab and its panel (controlled). */
  value?: TabValue;
  /** Initially selected tab when uncontrolled. */
  defaultValue?: TabValue;
  /** Called with the value of the tab the user selected, and when a fallback selection replaces a value that names no enabled tab. */
  onChange?: (value: TabValue) => void;
  /** `automatic` selects a tab when it receives focus, `manual` only on Enter, Space or click. */
  activation?: 'automatic' | 'manual';
  ref?: Ref<HTMLDivElement>;
}

/** Coordinates a `TabList` with its `TabPanel`s (WAI-ARIA tabs pattern). Panels are optional. */
export function Tabs({ value, defaultValue, onChange, activation = 'automatic', className, ...rest }: TabsProps) {
  const baseId = useId();
  const [selected, setSelected] = useControllable<TabValue | undefined>(
    value,
    defaultValue,
    onChange as ((v: TabValue | undefined) => void) | undefined,
  );
  const [tabs, setTabs] = useState<TabEntry[]>([]);
  const [panels, setPanels] = useState<ReadonlySet<string>>(new Set());

  const ordered = sortTabs(tabs);
  const activeValue = resolveActiveValue(selected, ordered);
  const tabbableValue = ordered.some((tab) => tab.value === activeValue) ? activeValue : ordered[0]?.value;

  // Like the Angular tabs, write a fallback selection back: when the value names no enabled tab, the first enabled
  // tab is shown, so the owner of the value must hear about it instead of staying on a stale value.
  useEffect(() => {
    if (ordered.length > 0 && activeValue !== undefined && activeValue !== selected) setSelected(activeValue);
  }, [ordered.length, activeValue, selected, setSelected]);

  const select = (next: TabValue) => {
    if (next !== activeValue) setSelected(next);
  };
  const registerTab = useCallback((entry: TabEntry) => {
    setTabs((prev) => [...prev.filter((tab) => tab.id !== entry.id), entry]);
    return () => setTabs((prev) => prev.filter((tab) => tab.id !== entry.id));
  }, []);
  const registerPanel = useCallback((panelValue: TabValue) => {
    const key = tabKey(panelValue);
    setPanels((prev) => new Set(prev).add(key));
    return () =>
      setPanels((prev) => {
        const next = new Set(prev);
        next.delete(key);
        return next;
      });
  }, []);

  return (
    <TabsContext
      value={{
        baseId,
        activeValue,
        tabbableValue,
        activation,
        tabs: ordered,
        panels,
        select,
        registerTab,
        registerPanel,
      }}
    >
      <div {...rest} className={cx('tumaet-ui-tabs', className)} />
    </TabsContext>
  );
}

export interface TabListProps extends HTMLAttributes<HTMLDivElement> {
  ref?: Ref<HTMLDivElement>;
}

/** Scrollable list of `Tab`s with a sliding selection indicator. Name it with `aria-label` or `aria-labelledby`. */
export function TabList({ className, children, onKeyDown, onFocus, ref, ...rest }: TabListProps) {
  const { tabs, activeValue, activation, select } = useTabsContext('TabList');
  const listRef = useRef<HTMLDivElement>(null);
  const indicatorReady = useRef(false);
  const [indicator, setIndicator] = useState({ offset: 0, width: 0, animate: false });
  const selectedElement = tabs.find((tab) => tab.value === activeValue)?.element;

  useLayoutEffect(() => {
    const update = () => {
      const width = selectedElement?.offsetWidth ?? 0;
      const offset = selectedElement?.offsetLeft ?? 0;
      const animate = indicatorReady.current;
      indicatorReady.current ||= width > 0;
      setIndicator((prev) =>
        prev.width === width && prev.offset === offset && prev.animate === animate ? prev : { offset, width, animate },
      );
    };
    update();
    if (typeof ResizeObserver === 'undefined') return;
    const observer = new ResizeObserver(update);
    if (listRef.current) observer.observe(listRef.current);
    tabs.forEach((tab) => observer.observe(tab.element));
    return () => observer.disconnect();
  }, [selectedElement, tabs]);

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    onKeyDown?.(event);
    if (event.defaultPrevented || tabs.length === 0) return;
    const current = tabs.findIndex((tab) => tab.element === (event.target as Element).closest('[role="tab"]'));
    if (current < 0) return;
    const rtl = listRef.current ? getComputedStyle(listRef.current).direction === 'rtl' : false;
    let target: number;
    switch (event.key) {
      case 'ArrowRight':
        target = current + (rtl ? -1 : 1);
        break;
      case 'ArrowLeft':
        target = current + (rtl ? 1 : -1);
        break;
      case 'Home':
        target = 0;
        break;
      case 'End':
        target = tabs.length - 1;
        break;
      default:
        return;
    }
    event.preventDefault();
    const next = tabs[(target + tabs.length) % tabs.length]!;
    next.element.focus();
    // A disabled tab can be reached with the arrow keys but is never selected.
    if (activation === 'automatic' && !next.disabled) select(next.value);
  };

  return (
    <div
      aria-orientation="horizontal"
      {...rest}
      ref={mergeRefs(ref, listRef)}
      role="tablist"
      className={cx('tumaet-ui-tab-list', className)}
      onKeyDown={handleKeyDown}
      onFocus={(event) => {
        onFocus?.(event);
        // Keep the tab the keyboard reached fully visible in a narrow, scrolling list.
        (event.target as HTMLElement)
          .closest?.('[role="tab"]')
          ?.scrollIntoView?.({ block: 'nearest', inline: 'nearest' });
      }}
    >
      {children}
      <span
        className="tumaet-ui-tab-indicator"
        data-animate={indicator.animate || undefined}
        aria-hidden="true"
        style={{ width: indicator.width, transform: `translateX(${indicator.offset}px)` }}
      />
    </div>
  );
}

export interface TabProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'value'> {
  /** Associates the tab with the `TabPanel` of the same value. */
  value: TabValue;
  ref?: Ref<HTMLButtonElement>;
}

/** A selectable tab. A disabled tab stays reachable with the arrow keys and is announced as unavailable, but cannot be selected. */
export function Tab({ value, disabled = false, className, onClick, ref, ...rest }: TabProps) {
  const { baseId, activeValue, tabbableValue, panels, select, registerTab } = useTabsContext('Tab');
  const id = useId();
  const innerRef = useRef<HTMLButtonElement>(null);
  const selected = activeValue === value;

  useLayoutEffect(() => {
    const element = innerRef.current;
    return element ? registerTab({ id, value, disabled, element }) : undefined;
  }, [id, value, disabled, registerTab]);

  return (
    <button
      {...rest}
      ref={mergeRefs(ref, innerRef)}
      type="button"
      role="tab"
      id={`${baseId}-tab-${idPart(value)}`}
      aria-selected={selected}
      aria-controls={panels.has(tabKey(value)) ? `${baseId}-panel-${idPart(value)}` : undefined}
      aria-disabled={disabled || undefined}
      tabIndex={tabbableValue === value ? 0 : -1}
      data-state={selected ? 'active' : 'inactive'}
      data-disabled={disabled || undefined}
      className={cx('tumaet-ui-tab', className)}
      onClick={(event) => {
        onClick?.(event);
        if (!event.defaultPrevented && !disabled) select(value);
      }}
    />
  );
}

export interface TabPanelsProps extends HTMLAttributes<HTMLDivElement> {
  ref?: Ref<HTMLDivElement>;
}

/** Layout container for the panels. */
export function TabPanels({ className, ...rest }: TabPanelsProps) {
  return <div {...rest} className={cx('tumaet-ui-tab-panels', className)} />;
}

export interface TabPanelProps extends Omit<HTMLAttributes<HTMLDivElement>, 'value'> {
  /** Associates the panel with the `Tab` of the same value. */
  value: TabValue;
  /** Keeps inactive content mounted (hidden) instead of unmounting it. */
  preserveContent?: boolean;
  /** Fills the height of a bounded parent. */
  fill?: boolean;
  ref?: Ref<HTMLDivElement>;
}

/** Content shown while the tab with the same value is selected. */
export function TabPanel({
  value,
  preserveContent = false,
  fill = false,
  className,
  children,
  ...rest
}: TabPanelProps) {
  const { baseId, activeValue, tabs, registerPanel } = useTabsContext('TabPanel');
  const active = activeValue === value;
  const hasTab = tabs.some((tab) => tab.value === value);

  useLayoutEffect(() => registerPanel(value), [value, registerPanel]);

  return (
    <div
      {...rest}
      role="tabpanel"
      id={`${baseId}-panel-${idPart(value)}`}
      aria-labelledby={hasTab ? `${baseId}-tab-${idPart(value)}` : undefined}
      hidden={!active}
      inert={!active}
      tabIndex={active ? 0 : undefined}
      data-state={active ? 'active' : 'inactive'}
      data-fill={fill || undefined}
      className={cx('tumaet-ui-tab-panel', className)}
    >
      {active || preserveContent ? children : null}
    </div>
  );
}
