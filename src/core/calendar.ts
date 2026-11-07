import { formatDate, formatDayMonth, fromDay, isoWeekNumber, monthName, monthSpan, toDay, weekdayOf } from './dates';

export type ViewLevel = 'day' | 'week' | 'month' | 'halfYear' | 'year';

/** First and last day (day numbers, both included) of what a view shows. */
export type Period = { level: ViewLevel; start: number; end: number; key: string; label: string };

export type CalendarOptions = {
  /** Weekday a week starts on: 0 = Monday ... 6 = Sunday. Default 0. */
  weekStart?: number;
};

export const VIEW_LEVELS: readonly { level: ViewLevel; label: string }[] = [
  { level: 'day', label: 'Day' },
  { level: 'week', label: 'Week' },
  { level: 'month', label: 'Month' },
  { level: 'halfYear', label: 'Half year' },
  { level: 'year', label: 'Year' },
];

const PERIOD_KEY = /^(day|week|month|halfYear|year):(\d{4}-\d{2}-\d{2})$/;
const DAYS_PER_WEEK = 7;
const MONTHS_PER_HALF_YEAR = 6;

const pad = (value: number) => String(value).padStart(2, '0');
const mod = (value: number, divisor: number) => ((value % divisor) + divisor) % divisor;

function labelOf(level: ViewLevel, start: number, end: number): string {
  const iso = fromDay(start);
  const [year, month] = iso.split('-').map(Number);
  switch (level) {
    case 'day':
      return formatDate(iso);
    case 'week': {
      const calendarWeek = weekdayOf(start) === 0 ? `CW ${isoWeekNumber(start + 3)}, ` : '';
      return `${calendarWeek}${formatDayMonth(start)} – ${formatDate(fromDay(end))}`;
    }
    case 'month':
      return `${monthName(month)} ${year}`;
    case 'halfYear':
      return `${month <= MONTHS_PER_HALF_YEAR ? 'H1' : 'H2'} ${year}`;
    case 'year':
      return String(year);
  }
}

function periodBetween(level: ViewLevel, start: number, end: number): Period {
  return { level, start, end, key: `${level}:${fromDay(start)}`, label: labelOf(level, start, end) };
}

/** The period of a level that contains the given date. */
export function periodOf(level: ViewLevel, iso: string, options: CalendarOptions = {}): Period {
  const day = toDay(iso);
  const [year, month] = iso.split('-').map(Number);
  switch (level) {
    case 'day':
      return periodBetween(level, day, day);
    case 'week': {
      const start = day - mod(weekdayOf(day) - (options.weekStart ?? 0), DAYS_PER_WEEK);
      return periodBetween(level, start, start + DAYS_PER_WEEK - 1);
    }
    case 'month': {
      const span = monthSpan(`${year}-${pad(month)}`);
      return periodBetween(level, span.start, span.end);
    }
    case 'halfYear': {
      const firstHalf = month <= MONTHS_PER_HALF_YEAR;
      return periodBetween(
        level,
        toDay(`${year}-${firstHalf ? '01-01' : '07-01'}`),
        toDay(`${year}-${firstHalf ? '06-30' : '12-31'}`),
      );
    }
    case 'year':
      return periodBetween(level, toDay(`${year}-01-01`), toDay(`${year}-12-31`));
  }
}

/** Reads a period key such as `week:2026-11-02`. Returns null for anything else, for example a free view. */
export function periodFromKey(key: string): Period | null {
  const match = PERIOD_KEY.exec(key);
  if (!match) return null;
  try {
    return periodOf(match[1] as ViewLevel, match[2], { weekStart: weekdayOf(toDay(match[2])) });
  } catch {
    return null;
  }
}

/** The period `count` steps away (negative: back). */
export function shiftPeriod(period: Period, count: number, options: CalendarOptions = {}): Period {
  const [year, month] = fromDay(period.start).split('-').map(Number);
  const shiftedMonth = (months: number) => {
    const total = year * 12 + (month - 1) + months;
    return `${Math.floor(total / 12)}-${pad(mod(total, 12) + 1)}-01`;
  };
  switch (period.level) {
    case 'day':
      return periodOf('day', fromDay(period.start + count), options);
    case 'week':
      return periodOf('week', fromDay(period.start + DAYS_PER_WEEK * count), { weekStart: weekdayOf(period.start) });
    case 'month':
      return periodOf('month', shiftedMonth(count), options);
    case 'halfYear':
      return periodOf('halfYear', shiftedMonth(MONTHS_PER_HALF_YEAR * count), options);
    case 'year':
      return periodOf('year', `${year + count}-01-01`, options);
  }
}
