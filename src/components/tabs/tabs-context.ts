import { createContext, useContext } from 'react';

export type TabValue = number | string;

export interface TabEntry {
  id: string;
  value: TabValue;
  disabled: boolean;
  element: HTMLElement;
}

export interface TabsContextValue {
  baseId: string;
  /** The value that is shown as selected: the bound value, or the first enabled tab when that matches no enabled tab. */
  activeValue: TabValue | undefined;
  /** Value of the tab that is in the tab order (roving tabindex). */
  tabbableValue: TabValue | undefined;
  activation: 'automatic' | 'manual';
  tabs: TabEntry[];
  panels: ReadonlySet<string>;
  select: (value: TabValue) => void;
  registerTab: (entry: TabEntry) => () => void;
  registerPanel: (value: TabValue) => () => void;
}

export const TabsContext = createContext<TabsContextValue | null>(null);

export function useTabsContext(component: string): TabsContextValue {
  const ctx = useContext(TabsContext);
  if (!ctx) throw new Error(`${component} must be used inside <Tabs>`);
  return ctx;
}

/** Keeps `1` and `'1'` apart, like the Angular tabs do. */
export function tabKey(value: TabValue): string {
  return `${typeof value === 'number' ? 'n' : 's'}:${value}`;
}

/** An id fragment that is safe in an HTML id and unique per key. */
export function idPart(value: TabValue): string {
  return tabKey(value).replace(/[^A-Za-z0-9-]/g, (c) => `_${c.charCodeAt(0).toString(16)}_`);
}

export function sortTabs(tabs: TabEntry[]): TabEntry[] {
  return [...tabs].sort((a, b) =>
    a.element.compareDocumentPosition(b.element) & Node.DOCUMENT_POSITION_FOLLOWING ? -1 : 1,
  );
}

/** The selection a tab list shows: the bound value if it names an enabled tab, otherwise the first enabled tab. */
export function resolveActiveValue(value: TabValue | undefined, ordered: TabEntry[]): TabValue | undefined {
  if (ordered.length === 0) return value;
  if (ordered.some((tab) => tab.value === value && !tab.disabled)) return value;
  return ordered.find((tab) => !tab.disabled)?.value;
}
