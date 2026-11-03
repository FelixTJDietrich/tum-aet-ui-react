import type { ReactNode } from 'react';

export type SortDirection = 'asc' | 'desc';

export interface SortState {
  field: string;
  direction: SortDirection;
}

export interface TableQuery {
  /** Zero-based page. */
  pageIndex: number;
  pageSize: number;
  sort?: SortState;
  searchTerm?: string;
}

export interface CellRendererParams<T> {
  data: T;
  col: ColumnDef<T>;
  value: unknown;
  rowIndex: number;
}

export interface ColumnDef<T> {
  /** Top-level property or nested path such as `owner.name` or `items[0].label`. */
  field?: (keyof T & string) | (string & {});
  header?: string;
  /** Translation key for the heading, used instead of `header`. */
  headerKey?: string;
  /** Translation key (or text) for a hint behind a help icon, for headings that are ambiguous alone. */
  headerTooltip?: string;
  /** Minimum width as any CSS length. A floor, not a cap. */
  width?: string;
  sort?: boolean;
  /** Lets a long heading wrap (headings are nowrap by default). */
  wrapHeader?: boolean;
  /** Hides the column below the given breakpoint (Tailwind widths: sm 40rem, md 48rem, lg 64rem, xl 80rem, 2xl 96rem). */
  hideBelow?: 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  /** Custom cell renderer. */
  cell?: (params: CellRendererParams<T>) => ReactNode;
}

/** Reads a nested value by a path like `a.b[0].c`. */
export function getByPath(source: unknown, path: string): unknown {
  const parts = path
    .replace(/\[(\w+)\]/g, '.$1')
    .split('.')
    .filter(Boolean);
  let current: unknown = source;
  for (const part of parts) {
    if (current === null || current === undefined) return undefined;
    current = (current as Record<string, unknown>)[part];
  }
  return current;
}

export function columnName<T>(col: ColumnDef<T>, index: number): string {
  return col.field ?? col.headerKey ?? col.header ?? `col-${index}`;
}

/** The next sort state when a sortable column is activated: a new column starts ascending, the active one toggles. */
export function nextSort(current: SortState | undefined, field: string): SortState {
  return current && current.field === field
    ? { field, direction: current.direction === 'asc' ? 'desc' : 'asc' }
    : { field, direction: 'asc' };
}

export function ariaSortFor(sort: SortState | undefined, field: string): 'ascending' | 'descending' | 'none' {
  if (!sort || sort.field !== field) return 'none';
  return sort.direction === 'asc' ? 'ascending' : 'descending';
}

export function lastPageIndex(totalRecords: number, pageSize: number): number {
  return totalRecords > 0 ? Math.ceil(totalRecords / Math.max(1, pageSize)) - 1 : 0;
}

/** Renders a cell value as text: nullish becomes empty, objects are not stringified to `[object Object]`. */
export function formatCellValue(value: unknown): string {
  if (value === null || value === undefined) return '';
  if (typeof value === 'object') return value instanceof Date ? value.toLocaleString() : JSON.stringify(value);
  return String(value);
}
