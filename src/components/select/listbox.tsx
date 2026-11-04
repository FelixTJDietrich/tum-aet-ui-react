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
    if (activeIndex < 0) return;
    const option = document.getElementById(optionId(id, activeIndex));
    // Not every environment implements scrollIntoView (jsdom, for one).
    if (option !== null && typeof option.scrollIntoView === 'function') option.scrollIntoView({ block: 'nearest' });
  }, [id, activeIndex]);

  return (
    <div
      id={id}
      role="listbox"
      aria-multiselectable={multiselectable === true ? true : undefined}
      className={cx('tumaet-ui-listbox', className)}
      {...aria}
    >
      {items.map((item, index) => (
        // Focus stays on the owner (trigger or text input), which handles the keys and sets aria-activedescendant.
        // eslint-disable-next-line jsx-a11y/click-events-have-key-events -- options are never focused; the owner provides keyboard operation
        <div
          key={item.key}
          id={optionId(id, index)}
          role="option"
          // Never reached by Tab and never focused by a click (see onMouseDown): focus stays with the owner.
          tabIndex={-1}
          aria-selected={item.selected}
          aria-disabled={item.disabled === true ? true : undefined}
          className={cx('tumaet-ui-listbox-option', optionClassName)}
          data-active={index === activeIndex || undefined}
          data-selected={item.selected ? true : undefined}
          data-disabled={item.disabled === true ? true : undefined}
          // Keeps focus where it is (trigger or text input) while an option is pressed.
          onMouseDown={(event) => event.preventDefault()}
          onClick={() => {
            if (item.disabled !== true) onSelect(index);
          }}
          onMouseEnter={() => {
            if (item.disabled !== true) onActivate(index);
          }}
        >
          {item.content}
        </div>
      ))}
      {items.length === 0 && (
        <div role="option" aria-selected="false" aria-disabled="true" className="tumaet-ui-listbox-empty">
          {emptyText}
        </div>
      )}
    </div>
  );
}
