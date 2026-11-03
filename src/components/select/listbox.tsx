import { useEffect, type ReactNode } from 'react';
import { cx } from '../../internal/cx';

export interface ListboxItem {
  key: string | number;
  content: ReactNode;
  selected: boolean;
  disabled?: boolean;
}

export interface ListboxProps {
  id: string;
  /** Prefix of the option ids: option `i` gets the id `${id}-option-${i}`. */
  items: readonly ListboxItem[];
  activeIndex: number;
  onActivate: (index: number) => void;
  onSelect: (index: number) => void;
  /** Shown as one disabled option when there are no items. */
  emptyText: string;
  multiselectable?: boolean;
  className?: string;
  optionClassName?: string;
  'aria-label'?: string;
  'aria-labelledby'?: string;
}

export function optionId(listboxId: string, index: number): string {
  return `${listboxId}-option-${index}`;
}

/** The popup list shared by Select, MultiSelect and Autocomplete. Focus stays outside, the owner sets aria-activedescendant. */
export function Listbox({
  id,
  items,
  activeIndex,
  onActivate,
  onSelect,
  emptyText,
  multiselectable,
  className,
  optionClassName,
  ...aria
}: ListboxProps) {
  useEffect(() => {
    if (activeIndex >= 0) document.getElementById(optionId(id, activeIndex))?.scrollIntoView?.({ block: 'nearest' });
  }, [id, activeIndex]);

  return (
    <ul
      id={id}
      role="listbox"
      aria-multiselectable={multiselectable || undefined}
      className={cx('tumaet-ui-listbox', className)}
      {...aria}
    >
      {items.map((item, index) => (
        <li
          key={item.key}
          id={optionId(id, index)}
          role="option"
          aria-selected={item.selected}
          aria-disabled={item.disabled || undefined}
          className={cx('tumaet-ui-listbox-option', optionClassName)}
          data-active={index === activeIndex || undefined}
          data-selected={item.selected || undefined}
          data-disabled={item.disabled || undefined}
          // Keeps focus where it is (trigger or text input) while an option is pressed.
          onMouseDown={(event) => event.preventDefault()}
          onClick={() => !item.disabled && onSelect(index)}
          onMouseEnter={() => !item.disabled && onActivate(index)}
        >
          {item.content}
        </li>
      ))}
      {items.length === 0 && (
        <li role="option" aria-selected="false" aria-disabled="true" className="tumaet-ui-listbox-empty">
          {emptyText}
        </li>
      )}
    </ul>
  );
}
