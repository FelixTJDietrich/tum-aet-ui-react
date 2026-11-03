import { useState, type HTMLAttributes, type KeyboardEvent, type ReactNode, type Ref } from 'react';
import { cx } from '../../internal/cx';
import { useControllable } from '../../internal/use-controllable';

export type SelectButtonSize = 'small' | 'default' | 'large';

interface SelectButtonBase extends Omit<HTMLAttributes<HTMLDivElement>, 'onChange' | 'defaultValue'> {
  /** Primitive options, or objects together with `optionLabel` / `optionValue`. Options with no label and no `itemTemplate` are omitted. */
  options: readonly unknown[];
  /** Object property used as the label. */
  optionLabel?: string;
  /** Object property used as the value; without it the option itself is the value. */
  optionValue?: string;
  /** Size variant: `small` (text-sm), `default` (text-base) or `large` (text-lg). */
  size?: SelectButtonSize;
  /** Single mode only: allows clicking the selected option to clear the selection. Default true. */
  allowEmpty?: boolean;
  /** Disables every option and marks the group `aria-disabled`. */
  disabled?: boolean;
  /** Custom option content; the option is the argument. Give icon-only content an accessible name. */
  itemTemplate?: (option: unknown) => ReactNode;
  ref?: Ref<HTMLDivElement>;
}

export interface SelectButtonSingleProps extends SelectButtonBase {
  /** Single selection (the default). */
  multiple?: false;
  /** Selected value; `null` is none. Omit for an uncontrolled field. */
  value?: unknown;
  /** Initially selected value of an uncontrolled field. */
  defaultValue?: unknown;
  /** Receives the new value, or `null` when cleared. */
  onChange?: (value: unknown) => void;
}

export interface SelectButtonMultipleProps extends SelectButtonBase {
  /** Allows several options to be on at once; the value is then an array. */
  multiple: true;
  /** Selected values. Omit for an uncontrolled field. */
  value?: readonly unknown[];
  /** Initially selected values of an uncontrolled field. */
  defaultValue?: readonly unknown[];
  /** Receives the new array of selected values. */
  onChange?: (value: unknown[]) => void;
}

export type SelectButtonProps = SelectButtonSingleProps | SelectButtonMultipleProps;

interface NormalizedOption {
  raw: unknown;
  value: unknown;
  label: ReactNode;
}

const isRecord = (v: unknown): v is Record<string, unknown> => v !== null && typeof v === 'object';
const displayLabel = (v: unknown) =>
  ['string', 'number', 'bigint', 'boolean'].includes(typeof v) ? String(v) : undefined;

/**
 * Segmented group of toggle buttons for a small, persistent set of choices; one (default) or several (`multiple`) can be on.
 * The buttons carry `aria-pressed`. Roving tabindex: one tab stop; arrow keys, Home and End move focus, Space/Enter toggle.
 */
export function SelectButton(props: SelectButtonProps) {
  const {
    options,
    optionLabel,
    optionValue,
    size = 'default',
    allowEmpty = true,
    disabled = false,
    itemTemplate,
    className,
    ref,
    ...rest
  } = props;
  const {
    multiple,
    value: _v,
    defaultValue: _d,
    onChange: _o,
    ...domProps
  } = rest as typeof rest & { multiple?: boolean; value?: unknown; defaultValue?: unknown; onChange?: unknown };
  const [current, setCurrent] = useControllable<unknown>(
    props.value,
    props.defaultValue ?? (props.multiple ? [] : null),
    props.onChange as ((v: unknown) => void) | undefined,
  );
  const [focusIndex, setFocusIndex] = useState<number | null>(null);

  const normalized: NormalizedOption[] = options.flatMap((raw) => {
    const record = isRecord(raw) ? raw : undefined;
    if ((optionLabel !== undefined || optionValue !== undefined) && !record) return [];
    const value = optionValue !== undefined ? record![optionValue] : raw;
    const label = displayLabel(optionLabel !== undefined ? record![optionLabel] : raw);
    if (label === undefined && !itemTemplate) return [];
    return [{ raw, value, label: label ?? '' }];
  });

  const isSelected = (option: NormalizedOption) =>
    multiple ? (current as unknown[]).includes(option.value) : current === option.value;

  const toggle = (option: NormalizedOption) => {
    if (disabled) return;
    const selected = isSelected(option);
    if (multiple) {
      const list = current as unknown[];
      setCurrent(selected ? list.filter((v) => v !== option.value) : [...list, option.value]);
    } else if (selected) {
      if (allowEmpty) setCurrent(null);
    } else {
      setCurrent(option.value);
    }
  };

  // Tab stop: the option that was last focused, else the first selected, else the first one.
  const firstSelected = normalized.findIndex(isSelected);
  const tabStop = focusIndex !== null && focusIndex < normalized.length ? focusIndex : Math.max(firstSelected, 0);

  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    domProps.onKeyDown?.(event);
    if (event.defaultPrevented || disabled) return;
    const buttons = [...event.currentTarget.querySelectorAll<HTMLButtonElement>('button')];
    const index = buttons.findIndex((b) => b === document.activeElement);
    if (index < 0) return;
    let next: number;
    if (event.key === 'ArrowRight' || event.key === 'ArrowDown') next = (index + 1) % buttons.length;
    else if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') next = (index - 1 + buttons.length) % buttons.length;
    else if (event.key === 'Home') next = 0;
    else if (event.key === 'End') next = buttons.length - 1;
    else return;
    event.preventDefault();
    buttons[next]?.focus();
  };

  return (
    <div
      role="group"
      aria-disabled={disabled || undefined}
      {...domProps}
      ref={ref}
      className={cx('tumaet-ui-select-button', className)}
      data-size={size}
      onKeyDown={onKeyDown}
    >
      {normalized.map((option, index) => (
        <button
          key={index}
          type="button"
          className="tumaet-ui-select-button-option"
          aria-pressed={isSelected(option)}
          disabled={disabled}
          tabIndex={index === tabStop ? 0 : -1}
          onFocus={() => setFocusIndex(index)}
          onClick={() => toggle(option)}
        >
          {itemTemplate ? itemTemplate(option.raw) : option.label}
        </button>
      ))}
    </div>
  );
}
