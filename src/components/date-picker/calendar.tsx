import { useLayoutEffect, useRef, useState, type HTMLAttributes, type KeyboardEvent, type Ref } from 'react';
import { cx } from '../../internal/cx';
import { ChevronLeftIcon, ChevronRightIcon } from '../../internal/icons';
import { useLocale, useTranslate } from '../../internal/i18n';
import {
  addDays,
  addMonths,
  addYears,
  buildMonthMatrix,
  daysInMonth,
  isDayDisabled,
  isSameDay,
  isSameMonth,
  startOfMonth,
  toIsoDay,
} from './date-picker-utils';

export interface CalendarProps extends Omit<HTMLAttributes<HTMLDivElement>, 'onChange'> {
  /** The selected day, marked with `aria-selected`. */
  selected?: Date | null;
  /** Any date in the month to show. */
  activeMonth: Date;
  /** Days before this day are shown but cannot be selected. Compared by day, so the time of day is ignored. */
  min?: Date | null;
  /** Days after this day are shown but cannot be selected. Compared by day, so the time of day is ignored. */
  max?: Date | null;
  /** Shows the days but ignores selection. */
  disabled?: boolean;
  /** Moves focus to the focused day when the calendar mounts, for use inside a dialog. */
  focusOnMount?: boolean;
  onDaySelect?: (day: Date) => void;
  /** Called with the first day of the month the user navigates to. */
  onMonthChange?: (month: Date) => void;
  ref?: Ref<HTMLDivElement>;
}

/** Month grid with roving focus, following the WAI-ARIA date picker dialog pattern. Weeks start on Monday. */
export function Calendar({
  selected,
  activeMonth,
  min,
  max,
  disabled,
  focusOnMount,
  onDaySelect,
  onMonthChange,
  className,
  ref,
  ...rest
}: CalendarProps) {
  const translate = useTranslate();
  const locale = useLocale();
  const [today] = useState(() => new Date());
  const root = useRef<HTMLDivElement | null>(null);
  const pendingFocus = useRef(!!focusOnMount);

  const selectedKey = selected ? toIsoDay(selected) : '';
  const monthKey = `${activeMonth.getFullYear()}-${activeMonth.getMonth()}`;

  const [focused, setFocused] = useState<Date>(
    () => selected ?? (isSameMonth(today, activeMonth) ? today : startOfMonth(activeMonth)),
  );
  const [synced, setSynced] = useState({ monthKey, selectedKey });
  if (synced.monthKey !== monthKey || synced.selectedKey !== selectedKey) {
    // A newly selected day takes the focus; otherwise keep the day of month when the month changes, clamped into shorter months.
    setSynced({ monthKey, selectedKey });
    if (selected && selectedKey !== synced.selectedKey) {
      setFocused(selected);
    } else {
      setFocused(
        new Date(
          activeMonth.getFullYear(),
          activeMonth.getMonth(),
          Math.min(focused.getDate(), daysInMonth(activeMonth)),
        ),
      );
    }
  }

  const format = (date: Date, options: Intl.DateTimeFormatOptions) =>
    new Intl.DateTimeFormat(locale, options).format(date);
  const weeks = buildMonthMatrix(activeMonth);
  const flat = weeks.flat();
  const at = (index: number) => flat[index] as Date;
  const monthLabel = format(activeMonth, { month: 'long', year: 'numeric' });
  const monthName = (offset: number) =>
    format(addMonths(startOfMonth(activeMonth), offset), { month: 'long', year: 'numeric' });
  const focusedIndex = Math.max(
    0,
    flat.findIndex((day) => isSameDay(day, focused)),
  );

  // Focus moves after the render that shows the target day, which may be in another month.
  useLayoutEffect(() => {
    if (!pendingFocus.current) return;
    const button = root.current?.querySelector<HTMLButtonElement>('button[data-date][tabindex="0"]');
    if (button) {
      pendingFocus.current = false;
      button.focus();
      // A popup that is still being positioned is hidden and refuses focus, so try once more on the next frame.
      if (document.activeElement !== button) requestAnimationFrame(() => button.focus());
    }
  });

  const changeMonth = (month: Date) => onMonthChange?.(startOfMonth(month));
  const selectDay = (day: Date) => {
    if (!disabled && !isDayDisabled(day, min, max)) onDaySelect?.(day);
  };

  const onKeyDown = (event: KeyboardEvent<HTMLButtonElement>, index: number) => {
    if (event.altKey || event.ctrlKey || event.metaKey) return;
    const moveTo = (target: number) => {
      event.preventDefault();
      const day = target >= 0 && target < flat.length ? at(target) : addDays(at(index), target - index);
      pendingFocus.current = true;
      setFocused(day);
      if (target < 0 || target >= flat.length) changeMonth(day);
    };
    switch (event.key) {
      case 'ArrowRight':
        return moveTo(index + (isRtl(event.currentTarget) ? -1 : 1));
      case 'ArrowLeft':
        return moveTo(index + (isRtl(event.currentTarget) ? 1 : -1));
      case 'ArrowDown':
        return moveTo(index + 7);
      case 'ArrowUp':
        return moveTo(index - 7);
      case 'Home':
        return moveTo(index - (index % 7));
      case 'End':
        return moveTo(index - (index % 7) + 6);
      case 'PageUp':
      case 'PageDown': {
        event.preventDefault();
        const sign = event.key === 'PageUp' ? -1 : 1;
        pendingFocus.current = true;
        changeMonth(
          event.shiftKey ? addYears(startOfMonth(activeMonth), sign) : addMonths(startOfMonth(activeMonth), sign),
        );
        return;
      }
      case 'Enter':
      case ' ': {
        event.preventDefault();
        const day = at(index);
        if (!isSameMonth(day, activeMonth)) pendingFocus.current = true;
        selectDay(day);
        return;
      }
    }
  };

  return (
    <div
      {...rest}
      ref={(node) => {
        root.current = node;
        if (typeof ref === 'function') ref(node);
        else if (ref) ref.current = node;
      }}
      className={cx('tumaet-ui-calendar', className)}
    >
      <div className="tumaet-ui-calendar-header">
        <button
          type="button"
          className="tumaet-ui-calendar-nav"
          onClick={() => changeMonth(addMonths(startOfMonth(activeMonth), -1))}
          aria-label={translate('tumAetUi.datePicker.previousMonth', { month: monthName(-1) })}
        >
          <ChevronLeftIcon />
        </button>
        <span className="tumaet-ui-calendar-title" aria-live="polite">
          {monthLabel}
        </span>
        <button
          type="button"
          className="tumaet-ui-calendar-nav"
          onClick={() => changeMonth(addMonths(startOfMonth(activeMonth), 1))}
          aria-label={translate('tumAetUi.datePicker.nextMonth', { month: monthName(1) })}
        >
          <ChevronRightIcon />
        </button>
      </div>
      <table role="grid" aria-label={monthLabel} className="tumaet-ui-calendar-grid">
        <thead>
          <tr>
            {(weeks[0] ?? []).map((day) => (
              <th key={day.getDay()} scope="col" aria-label={format(day, { weekday: 'long' })}>
                {format(day, { weekday: 'short' })}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {weeks.map((week, w) => (
            <tr key={w}>
              {week.map((day, d) => {
                const index = w * 7 + d;
                const isSelected = !!selected && isSameDay(selected, day);
                const isDisabled = disabled || isDayDisabled(day, min, max);
                return (
                  <td key={toIsoDay(day)} role="gridcell" aria-selected={isSelected ? 'true' : undefined}>
                    <button
                      type="button"
                      className="tumaet-ui-calendar-day"
                      data-date={toIsoDay(day)}
                      data-selected={isSelected || undefined}
                      data-today={isSameDay(day, today) || undefined}
                      data-outside={!isSameMonth(day, activeMonth) || undefined}
                      data-disabled={isDisabled || undefined}
                      tabIndex={focusedIndex === index ? 0 : -1}
                      aria-label={format(day, { dateStyle: 'full' })}
                      aria-disabled={isDisabled ? 'true' : undefined}
                      onClick={() => selectDay(day)}
                      onKeyDown={(event) => onKeyDown(event, index)}
                    >
                      {day.getDate()}
                    </button>
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function isRtl(element: Element): boolean {
  return getComputedStyle(element).direction === 'rtl';
}
