import {
  addDays,
  addMonths,
  buildMonthMatrix,
  combineDateAndTime,
  compareDays,
  formatDisplay,
  isDayDisabled,
  matchesDisplayFormat,
  nearestAllowedDay,
  normalizeDisplayText,
  parseDisplay,
  toIsoDay,
  valuesEqual,
} from './date-picker-utils';

describe('parseDisplay and formatDisplay', () => {
  it('round-trips a date and time', () => {
    const parsed = parseDisplay('13.06.2026 08:30');
    expect(parsed).toEqual(new Date(2026, 5, 13, 8, 30));
    expect(formatDisplay(parsed!)).toBe('13.06.2026 08:30');
  });

  it('returns undefined for empty or blank text', () => {
    expect(parseDisplay('')).toBeUndefined();
    expect(parseDisplay('   ')).toBeUndefined();
  });

  it('rejects malformed text strictly', () => {
    for (const text of [
      '13.06.2026',
      '13.06.26 08:30',
      '13/06/2026 08:30',
      '13.06.2026 8:30',
      '2026-06-13 08:30',
      '13.06.2026 08:30:00',
      '13.06.2026 08:30 x',
      'abc',
    ]) {
      expect(parseDisplay(text), text).toBeUndefined();
    }
  });

  it('rejects impossible dates and times', () => {
    for (const text of [
      '31.02.2026 10:00',
      '31.04.2026 10:00',
      '00.01.2026 10:00',
      '01.00.2026 10:00',
      '01.13.2026 10:00',
      '29.02.2026 10:00',
      '01.01.0000 10:00',
      '01.01.2026 24:00',
      '01.01.2026 10:60',
    ]) {
      expect(parseDisplay(text), text).toBeUndefined();
    }
  });

  it('accepts 29 February only in leap years, including the century rule', () => {
    expect(parseDisplay('29.02.2024 00:00')).toEqual(new Date(2024, 1, 29));
    expect(parseDisplay('29.02.2000 00:00')).toEqual(new Date(2000, 1, 29));
    expect(parseDisplay('29.02.1900 00:00')).toBeUndefined();
    expect(parseDisplay('29.02.2100 00:00')).toBeUndefined();
  });

  it('keeps years below 100 as typed instead of mapping them to 19xx', () => {
    const parsed = parseDisplay('01.01.0050 10:00');
    expect(parsed?.getFullYear()).toBe(50);
    expect(formatDisplay(parsed!)).toBe('01.01.0050 10:00');
  });

  it('reads midnight and the last minute of the day', () => {
    expect(parseDisplay('01.01.2026 00:00')).toEqual(new Date(2026, 0, 1, 0, 0));
    expect(parseDisplay('31.12.2026 23:59')).toEqual(new Date(2026, 11, 31, 23, 59));
  });

  it('reads pasted text whose whitespace differs from the plain space', () => {
    const expected = new Date(2026, 5, 13, 8, 30);
    expect(parseDisplay('13.06.2026 08:30')).toEqual(expected);
    expect(parseDisplay('  13.06.2026   08:30 ')).toEqual(expected);
    expect(parseDisplay('13.06.2026\t08:30')).toEqual(expected);
  });

  it('does not accept text that only looks like a date once whitespace is ignored', () => {
    expect(parseDisplay('13.06.2026 08 :30')).toBeUndefined();
    expect(parseDisplay('13. 06.2026 08:30')).toBeUndefined();
  });

  it('parses a date on its own at the start of the day and rejects a time', () => {
    expect(parseDisplay('13.06.2026', false, null, true)).toEqual(new Date(2026, 5, 13, 0, 0));
    expect(parseDisplay('13.06.2026 08:30', false, null, true)).toBeUndefined();
    expect(parseDisplay('31.02.2026', false, null, true)).toBeUndefined();
  });

  it('places a time on its own on the given date or today', () => {
    expect(parseDisplay('08:30', true, new Date(2026, 5, 13, 22, 0))).toEqual(new Date(2026, 5, 13, 8, 30));
    const today = new Date();
    const onToday = parseDisplay('08:30', true);
    expect(onToday?.getDate()).toBe(today.getDate());
    expect(onToday?.getHours()).toBe(8);
    expect(parseDisplay('13.06.2026 08:30', true)).toBeUndefined();
    expect(parseDisplay('24:00', true)).toBeUndefined();
    expect(parseDisplay('8:30', true)).toBeUndefined();
  });

  it('formats without relying on the locale', () => {
    expect(formatDisplay(new Date(2026, 0, 5, 7, 5))).toBe('05.01.2026 07:05');
    expect(formatDisplay(new Date(2026, 0, 5, 7, 5), false, true)).toBe('05.01.2026');
    expect(formatDisplay(new Date(2026, 0, 5, 7, 5), true)).toBe('07:05');
  });
});

describe('daylight saving time', () => {
  const previous = process.env.TZ;
  beforeAll(() => {
    process.env.TZ = 'Europe/Berlin';
  });
  afterAll(() => {
    if (previous === undefined) delete process.env.TZ;
    else process.env.TZ = previous;
  });

  it('rejects a local time that does not exist', () => {
    expect(new Date(2026, 2, 29, 12).getTimezoneOffset()).toBe(-120); // Europe/Berlin
    expect(parseDisplay('29.03.2026 02:30')).toBeUndefined();
    expect(parseDisplay('29.03.2026 03:30')).toEqual(new Date(2026, 2, 29, 3, 30));
    expect(parseDisplay('02:30', true, new Date(2026, 2, 29, 12))).toBeUndefined();
  });

  it('accepts both occurrences of the repeated hour as the same text', () => {
    expect(new Date(2026, 9, 25, 12).getTimezoneOffset()).toBe(-60); // Europe/Berlin
    expect(formatDisplay(parseDisplay('25.10.2026 02:30')!)).toBe('25.10.2026 02:30');
  });

  it('adds calendar days across the change without drifting', () => {
    expect(new Date(2026, 2, 29, 12).getTimezoneOffset()).toBe(-120); // Europe/Berlin
    expect(toIsoDay(addDays(new Date(2026, 2, 28), 1))).toBe('2026-03-29');
    expect(toIsoDay(addDays(new Date(2026, 2, 29), 1))).toBe('2026-03-30');
    expect(toIsoDay(addDays(new Date(2026, 9, 24), 2))).toBe('2026-10-26');
    const week = buildMonthMatrix(new Date(2026, 2, 1)).flat();
    expect(new Set(week.map(toIsoDay)).size).toBe(42);
    expect(week.every((d) => d.getHours() === 0 || d.getHours() === 1)).toBe(true);
  });
});

describe('normalizeDisplayText and matchesDisplayFormat', () => {
  it('collapses whitespace runs without touching other characters', () => {
    expect(normalizeDisplayText(' a  \t b  c ')).toBe('a b c');
    expect(normalizeDisplayText('')).toBe('');
  });

  it('checks the shape for each format', () => {
    expect(matchesDisplayFormat('13.06.2026 08:30', false)).toBe(true);
    expect(matchesDisplayFormat('13.06.2026', false)).toBe(false);
    expect(matchesDisplayFormat('13.06.2026', false, true)).toBe(true);
    expect(matchesDisplayFormat('08:30', true)).toBe(true);
    expect(matchesDisplayFormat('25:30', true)).toBe(false);
  });
});

describe('buildMonthMatrix', () => {
  it('builds six Monday-first weeks including the boundaries', () => {
    const weeks = buildMonthMatrix(new Date(2026, 5, 17));
    expect(weeks).toHaveLength(6);
    expect(weeks.every((w) => w.length === 7)).toBe(true);
    expect(toIsoDay(weeks[0]![0]!)).toBe('2026-06-01'); // 1 June 2026 is a Monday
    expect(toIsoDay(weeks[5]![6]!)).toBe('2026-07-12');
    expect(weeks.flat().every((d) => d.getHours() === 0 && d.getMinutes() === 0)).toBe(true);
  });

  it('starts the grid in the previous month when the 1st is late in the week', () => {
    const weeks = buildMonthMatrix(new Date(2026, 7, 1)); // 1 August 2026 is a Saturday
    expect(toIsoDay(weeks[0]![0]!)).toBe('2026-07-27');
    expect(toIsoDay(weeks[0]![5]!)).toBe('2026-08-01');
  });

  it('includes 29 February in a leap-year grid and not in a common year', () => {
    expect(
      buildMonthMatrix(new Date(2024, 1, 1))
        .flat()
        .map(toIsoDay),
    ).toContain('2024-02-29');
    expect(
      buildMonthMatrix(new Date(2026, 1, 1))
        .flat()
        .map(toIsoDay),
    ).not.toContain('2026-02-29');
  });

  it('handles a February that fits exactly into four weeks', () => {
    const days = buildMonthMatrix(new Date(2027, 1, 1))
      .flat()
      .map(toIsoDay); // 1 Feb 2027 is a Monday
    expect(days[0]).toBe('2027-02-01');
    expect(days[27]).toBe('2027-02-28');
    expect(days[28]).toBe('2027-03-01');
  });

  it('crosses a year boundary', () => {
    const days = buildMonthMatrix(new Date(2026, 11, 1))
      .flat()
      .map(toIsoDay);
    expect(days).toContain('2026-12-31');
    expect(days).toContain('2027-01-01');
  });
});

describe('date arithmetic', () => {
  it('clamps the day of month when adding months', () => {
    expect(toIsoDay(addMonths(new Date(2026, 0, 31), 1))).toBe('2026-02-28');
    expect(toIsoDay(addMonths(new Date(2024, 0, 31), 1))).toBe('2024-02-29');
    expect(toIsoDay(addMonths(new Date(2026, 2, 31), -1))).toBe('2026-02-28');
    expect(toIsoDay(addMonths(new Date(2026, 11, 15), 1))).toBe('2027-01-15');
    expect(toIsoDay(addMonths(new Date(2026, 0, 15), -1))).toBe('2025-12-15');
    expect(toIsoDay(addMonths(new Date(2024, 1, 29), 12))).toBe('2025-02-28');
  });

  it('keeps the time of day when adding months', () => {
    const next = addMonths(new Date(2026, 0, 31, 9, 45), 1);
    expect([next.getHours(), next.getMinutes()]).toEqual([9, 45]);
  });

  it('combines a day with a time at minute precision', () => {
    const combined = combineDateAndTime(new Date(2026, 5, 13, 1, 2, 3, 4), new Date(2020, 0, 1, 17, 45, 59, 999));
    expect(combined).toEqual(new Date(2026, 5, 13, 17, 45, 0, 0));
  });

  it('compares values to the minute', () => {
    expect(valuesEqual(new Date(2026, 0, 1, 10, 0, 5), new Date(2026, 0, 1, 10, 0, 40))).toBe(true);
    expect(valuesEqual(new Date(2026, 0, 1, 10, 0), new Date(2026, 0, 1, 10, 1))).toBe(false);
    expect(valuesEqual(null, undefined)).toBe(true);
    expect(valuesEqual(null, new Date())).toBe(false);
  });

  it('compares days regardless of the time', () => {
    expect(compareDays(new Date(2026, 0, 1, 23, 59), new Date(2026, 0, 1, 0, 0))).toBe(0);
    expect(compareDays(new Date(2026, 0, 1), new Date(2026, 0, 2))).toBeLessThan(0);
    expect(compareDays(new Date(2027, 0, 1), new Date(2026, 11, 31))).toBeGreaterThan(0);
  });
});

describe('min and max', () => {
  const min = new Date(2026, 5, 10, 18, 0);
  const max = new Date(2026, 5, 20, 6, 0);

  it('disables only days outside the range, whatever the time of day of the limits', () => {
    expect(isDayDisabled(new Date(2026, 5, 9), min, max)).toBe(true);
    expect(isDayDisabled(new Date(2026, 5, 10), min, max)).toBe(false);
    expect(isDayDisabled(new Date(2026, 5, 20), min, max)).toBe(false);
    expect(isDayDisabled(new Date(2026, 5, 21), min, max)).toBe(true);
    expect(isDayDisabled(new Date(2026, 5, 21), undefined, undefined)).toBe(false);
  });

  it('finds the nearest allowed day to open on', () => {
    const today = new Date(2026, 5, 1);
    expect(nearestAllowedDay(undefined, undefined, today)).toBe(today);
    expect(nearestAllowedDay(min, max, today)).toBe(min);
    expect(nearestAllowedDay(undefined, new Date(2026, 4, 1), today)).toEqual(new Date(2026, 4, 1));
    expect(nearestAllowedDay(new Date(2026, 4, 1), new Date(2026, 6, 1), today)).toBe(today);
  });
});
