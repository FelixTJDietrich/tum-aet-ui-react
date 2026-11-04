import { useState, type KeyboardEvent, type Ref } from 'react';
import { useTranslate } from '../../internal/i18n';
import { ChevronDownIcon, ChevronUpIcon } from '../../internal/icons';

export interface TimeControlsProps {
  value: Date | null;
  disabled?: boolean;
  /** Marks the hour and minute fields required for assistive technology. */
  required?: boolean;
  /** Called with a complete hour and minute. */
  onCommit: (hour: number, minute: number) => void;
  hourRef?: Ref<HTMLInputElement>;
}

function arrowDelta(key: string): number {
  if (key === 'ArrowUp') return 1;
  return key === 'ArrowDown' ? -1 : 0;
}

function parsePart(raw: string, max: number): number | undefined {
  const trimmed = raw.trim();
  if (!/^\d{1,2}$/.test(trimmed)) return undefined;
  const value = Number(trimmed);
  return value <= max ? value : undefined;
}

const two = (n: number) => String(n).padStart(2, '0');

/** Hour and minute steppers with typed entry. The fields stay empty, not `00`, until a time is set. */
export function TimeControls({ value, disabled, required, onCommit, hourRef }: TimeControlsProps) {
  const translate = useTranslate();
  const [drafts, setDrafts] = useState<{ hour: string | null; minute: string | null }>({ hour: null, minute: null });
  const hour = value ? value.getHours() : 0;
  const minute = value ? value.getMinutes() : 0;
  const shown = { hour: value ? two(hour) : '', minute: value ? two(minute) : '' };

  const commit = (nextHour: number, nextMinute: number) => {
    setDrafts({ hour: null, minute: null });
    onCommit(nextHour, nextMinute);
  };

  const finishEdit = (field: 'hour' | 'minute') => {
    const draft = drafts[field];
    if (draft === null) return;
    const parsed = parsePart(draft, field === 'hour' ? 23 : 59);
    if (parsed === undefined) setDrafts((d) => ({ ...d, [field]: null }));
    else if (field === 'hour') commit(parsed, minute);
    else commit(hour, parsed);
  };

  const onKeyDown = (event: KeyboardEvent<HTMLInputElement>, field: 'hour' | 'minute') => {
    if (event.key === 'Enter') {
      event.preventDefault();
      finishEdit(field);
      return;
    }
    const delta = arrowDelta(event.key);
    if (delta === 0) return;
    event.preventDefault();
    const size = field === 'hour' ? 24 : 60;
    const typed = parsePart(event.currentTarget.value, size - 1);
    const base = typed ?? (field === 'hour' ? hour : minute);
    const next = (base + delta + size) % size;
    if (field === 'hour') commit(next, minute);
    else commit(hour, next);
  };

  const field = (name: 'hour' | 'minute') => (
    <div className="tumaet-ui-time-column">
      <button
        type="button"
        className="tumaet-ui-time-step"
        disabled={disabled}
        onClick={() => commit(name === 'hour' ? (hour + 1) % 24 : hour, name === 'minute' ? (minute + 1) % 60 : minute)}
        aria-label={translate(
          name === 'hour' ? 'tumAetUi.datePicker.incrementHour' : 'tumAetUi.datePicker.incrementMinute',
        )}
      >
        <ChevronUpIcon />
      </button>
      <input
        ref={name === 'hour' ? hourRef : undefined}
        type="text"
        inputMode="numeric"
        maxLength={2}
        placeholder={name === 'hour' ? 'HH' : 'MM'}
        className="tumaet-ui-time-input"
        value={drafts[name] ?? shown[name]}
        disabled={disabled}
        aria-label={translate(name === 'hour' ? 'tumAetUi.datePicker.hour' : 'tumAetUi.datePicker.minute')}
        aria-required={required === true ? 'true' : undefined}
        onChange={(event) => setDrafts((d) => ({ ...d, [name]: event.target.value }))}
        onBlur={() => finishEdit(name)}
        onKeyDown={(event) => onKeyDown(event, name)}
      />
      <button
        type="button"
        className="tumaet-ui-time-step"
        disabled={disabled}
        onClick={() =>
          commit(name === 'hour' ? (hour + 23) % 24 : hour, name === 'minute' ? (minute + 59) % 60 : minute)
        }
        aria-label={translate(
          name === 'hour' ? 'tumAetUi.datePicker.decrementHour' : 'tumAetUi.datePicker.decrementMinute',
        )}
      >
        <ChevronDownIcon />
      </button>
    </div>
  );

  return (
    <div className="tumaet-ui-time-controls" role="group" aria-label={translate('tumAetUi.datePicker.time')}>
      {field('hour')}
      <span className="tumaet-ui-time-separator" aria-hidden="true">
        :
      </span>
      {field('minute')}
    </div>
  );
}
