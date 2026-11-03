/**
 * Date logic of the date picker. Everything works on local time, like the Angular version: a value is a `Date`, the text format
 * is fixed (`DD.MM.YYYY HH:mm`, `DD.MM.YYYY` or `HH:mm`) and a time on its own is placed on a date.
 */

export const DISPLAY_REGEX = /^\d{2}\.\d{2}\.\d{4} \d{2}:\d{2}$/;
export const TIME_REGEX = /^([01]\d|2[0-3]):[0-5]\d$/;
export const DATE_REGEX = /^\d{2}\.\d{2}\.\d{4}$/;

const DAY_MS = 24 * 60 * 60 * 1000;

/** Local date at midnight, built so that years 0-99 are not mapped to 1900-1999. */
function makeDate(year: number, month: number, day: number, hour = 0, minute = 0): Date {
  const date = new Date(2000, 0, 1, 0, 0, 0, 0);
  date.setFullYear(year, month, day);
  date.setHours(hour, minute, 0, 0);
  return date;
}

export function startOfDay(date: Date): Date {
  return makeDate(date.getFullYear(), date.getMonth(), date.getDate());
}

export function startOfMonth(date: Date): Date {
  return makeDate(date.getFullYear(), date.getMonth(), 1);
}

/** Adds whole calendar days; unlike adding 24 hours this is correct across daylight saving changes. Keeps the time of day where it exists. */
export function addDays(date: Date, days: number): Date {
  const next = new Date(date.getTime());
  next.setDate(next.getDate() + days);
  return next;
}

/** Adds months to a date, clamping the day of month into the target month (31 Jan + 1 month = 28/29 Feb). */
export function addMonths(date: Date, months: number): Date {
  const target = new Date(date.getFullYear(), date.getMonth() + months, 1);
  const day = Math.min(date.getDate(), daysInMonth(target));
  const next = new Date(date.getTime());
  next.setFullYear(target.getFullYear(), target.getMonth(), day);
  return next;
}

export function addYears(date: Date, years: number): Date {
  return addMonths(date, years * 12);
}

export function daysInMonth(date: Date): number {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
}

export function isSameDay(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

export function isSameMonth(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth();
}

/** Negative, zero or positive like a comparator, compared by calendar day. */
export function compareDays(a: Date, b: Date): number {
  return a.getFullYear() - b.getFullYear() || a.getMonth() - b.getMonth() || a.getDate() - b.getDate();
}

/** `YYYY-MM-DD` in local time, independent of the locale. */
export function toIsoDay(date: Date): string {
  return `${String(date.getFullYear()).padStart(4, '0')}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

/** Whether `day` lies before `min` or after `max`. Compared by day, so the time of day of the limits is ignored. */
export function isDayDisabled(day: Date, min?: Date | null, max?: Date | null): boolean {
  return (!!min && compareDays(day, min) < 0) || (!!max && compareDays(day, max) > 0);
}

/** Today, or the closest day the range allows when today lies outside it. */
export function nearestAllowedDay(min?: Date | null, max?: Date | null, today = new Date()): Date {
  if (min && compareDays(today, min) < 0) return min;
  if (max && compareDays(today, max) > 0) return max;
  return today;
}

function pad(n: number, length = 2): string {
  return String(n).padStart(length, '0');
}

/**
 * Trims the text and turns every run of whitespace (including the non-breaking space that Word, Outlook and web pages put between
 * date and time) into one plain space.
 */
export function normalizeDisplayText(text: string): string {
  return text.trim().split(/\s+/).filter(Boolean).join(' ');
}

/** Whether `text`, already normalized, is shaped like a complete entry for that format. */
export function matchesDisplayFormat(text: string, timeOnly: boolean, dateOnly = false): boolean {
  return dateOnly ? DATE_REGEX.test(text) : timeOnly ? TIME_REGEX.test(text) : DISPLAY_REGEX.test(text);
}

/**
 * Parses text in the picker's format strictly: impossible dates (31.02.), hour 24, years before 0001 and local times that do not
 * exist (the hour skipped when the clocks go forward) give `undefined`. A time on its own is placed on `onDate`, the value already
 * held or today, which keeps the date stable while only the time is edited. A date on its own is returned at the start of the day.
 */
export function parseDisplay(text: string, timeOnly = false, onDate?: Date | null, dateOnly = false): Date | undefined {
  const normalized = normalizeDisplayText(text);
  if (!normalized || !matchesDisplayFormat(normalized, timeOnly, dateOnly)) return undefined;

  if (timeOnly) {
    const [hour = 0, minute = 0] = normalized.split(':').map(Number);
    const base = onDate ?? new Date();
    const result = makeDate(base.getFullYear(), base.getMonth(), base.getDate(), hour, minute);
    // The time may not exist on that day (daylight saving gap).
    return result.getHours() === hour && result.getMinutes() === minute ? result : undefined;
  }

  const [datePart = '', timePart] = normalized.split(' ');
  const [day = 0, month = 0, year = 0] = datePart.split('.').map(Number);
  const [hour = 0, minute = 0] = timePart ? timePart.split(':').map(Number) : [0, 0];
  if (year < 1 || month < 1 || month > 12 || day < 1 || hour > 23 || minute > 59) return undefined;
  const result = makeDate(year, month - 1, day, hour, minute);
  const roundTrips =
    result.getFullYear() === year &&
    result.getMonth() === month - 1 &&
    result.getDate() === day &&
    result.getHours() === hour &&
    result.getMinutes() === minute;
  return roundTrips ? result : undefined;
}

export function formatDisplay(value: Date, timeOnly = false, dateOnly = false): string {
  const time = `${pad(value.getHours())}:${pad(value.getMinutes())}`;
  if (timeOnly) return time;
  const date = `${pad(value.getDate())}.${pad(value.getMonth() + 1)}.${pad(value.getFullYear(), 4)}`;
  return dateOnly ? date : `${date} ${time}`;
}

/** `HH:mm` of a value, used by the hour and minute fields. */
export function formatTime(value: Date): string {
  return `${pad(value.getHours())}:${pad(value.getMinutes())}`;
}

/** Six Monday-first weeks that contain the month, as local dates at the start of the day. */
export function buildMonthMatrix(month: Date): Date[][] {
  const first = startOfMonth(month);
  const offset = (first.getDay() + 6) % 7;
  const weeks: Date[][] = [];
  for (let week = 0; week < 6; week++) {
    const days: Date[] = [];
    for (let day = 0; day < 7; day++) {
      days.push(makeDate(first.getFullYear(), first.getMonth(), 1 - offset + week * 7 + day));
    }
    weeks.push(days);
  }
  return weeks;
}

/** The day of `date` with the hour and minute of `time`, seconds and milliseconds zeroed. */
export function combineDateAndTime(date: Date, time: Date): Date {
  return makeDate(date.getFullYear(), date.getMonth(), date.getDate(), time.getHours(), time.getMinutes());
}

/** Equality to the minute, the precision of the picker. */
export function valuesEqual(a: Date | null | undefined, b: Date | null | undefined): boolean {
  if (!a && !b) return true;
  if (!a || !b) return false;
  return Math.floor(a.getTime() / 60000) === Math.floor(b.getTime() / 60000);
}

/** Whole days between two dates by calendar day (DST-safe). */
export function diffDays(a: Date, b: Date): number {
  return Math.round(
    (Date.UTC(a.getFullYear(), a.getMonth(), a.getDate()) - Date.UTC(b.getFullYear(), b.getMonth(), b.getDate())) /
      DAY_MS,
  );
}
