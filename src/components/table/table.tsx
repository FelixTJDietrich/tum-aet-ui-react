import type { HTMLAttributes, Ref, ThHTMLAttributes } from 'react';
import { createContext, useContext } from 'react';
import { cx } from '../../internal/cx';
import { SortDownIcon, SortIcon, SortUpIcon } from '../../internal/icons';

export interface TableSortEvent {
  field: string;
  /** `1` ascending, `-1` descending. */
  order: number;
}

interface TableContextValue {
  sortField?: string;
  sortOrder: number;
  defaultSortOrder: number;
  onSortChange?: (event: TableSortEvent) => void;
}
const TableContext = createContext<TableContextValue | null>(null);

export type TableSize = 'small' | 'normal' | 'large';

export interface TableProps extends HTMLAttributes<HTMLTableElement> {
  size?: TableSize;
  striped?: boolean;
  /** Makes header cells sticky; give the scrolling parent a height. */
  scrollable?: boolean;
  rowHover?: boolean;
  /** Field of the column currently sorted, read by `SortableColumnHeader`s. */
  sortField?: string;
  /** `1` ascending, `-1` descending. */
  sortOrder?: number;
  /** Order requested when a column that is not sorted is activated. */
  defaultSortOrder?: number;
  onSortChange?: (event: TableSortEvent) => void;
  ref?: Ref<HTMLTableElement>;
}

/**
 * Styles a plain native `<table>`. Give it a `<caption>` or `aria-label`, use `<th scope="col">` for headings and
 * `SortableColumnHeader` for sortable ones. The consumer sorts the rows.
 */
export function Table({
  size = 'normal',
  striped = false,
  scrollable = false,
  rowHover = false,
  sortField,
  sortOrder = 1,
  defaultSortOrder = 1,
  onSortChange,
  className,
  ...rest
}: TableProps) {
  return (
    <TableContext value={{ sortField, sortOrder, defaultSortOrder, onSortChange }}>
      <table
        {...rest}
        className={cx('tumaet-ui-table', className)}
        data-size={size}
        data-striped={striped || undefined}
        data-scrollable={scrollable || undefined}
        data-row-hover={rowHover || undefined}
      />
    </TableContext>
  );
}

export interface SortableColumnHeaderProps extends ThHTMLAttributes<HTMLTableCellElement> {
  /** Field passed to `onSortChange` of the surrounding `Table`. */
  field: string;
  disabled?: boolean;
  ref?: Ref<HTMLTableCellElement>;
}

/** A `<th>` whose content is a button that requests sorting by `field`; sets `aria-sort` from the surrounding `Table`. */
export function SortableColumnHeader({
  field,
  disabled = false,
  className,
  children,
  ...rest
}: SortableColumnHeaderProps) {
  const table = useContext(TableContext);
  if (!table) throw new Error('SortableColumnHeader must be used inside <Table>');
  const active = table.sortField === field && table.sortOrder !== 0;
  const ariaSort = !active ? 'none' : table.sortOrder < 0 ? 'descending' : 'ascending';
  const Glyph = !active ? SortIcon : table.sortOrder < 0 ? SortDownIcon : SortUpIcon;
  return (
    <th
      scope="col"
      {...rest}
      aria-sort={ariaSort}
      data-sortable={disabled ? undefined : true}
      className={cx('tumaet-ui-sortable-column', className)}
    >
      <button
        type="button"
        className="tumaet-ui-sort-button"
        disabled={disabled}
        onClick={() =>
          table.onSortChange?.({
            field,
            order: table.sortField === field ? table.sortOrder * -1 : table.defaultSortOrder,
          })
        }
      >
        {children}
        <Glyph className="tumaet-ui-icon tumaet-ui-sort-icon" />
      </button>
    </th>
  );
}
