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

type Span = { start: number; end: number };

/** What a level knows about itself: which days it covers, how it is called, and where the next one starts. */
type LevelRule = {
  span(iso: string, options: CalendarOptions): Span;
  label(span: Span): string;
  /** The date inside the period `count` steps away, and the options to build that period with. */
  shifted(period: Period, count: number): { iso: string; options: CalendarOptions };
};

const PERIOD_KEY = /^(day|week|month|halfYear|year):(\d{4}-\d{2}-\d{2})$/;
const DAYS_PER_WEEK = 7;
const MONTHS_PER_HALF_YEAR = 6;
const MONTHS_PER_YEAR = 12;

const pad = (value: number) => String(value).padStart(2, '0');
const mod = (value: number, divisor: number) => ((value % divisor) + divisor) % divisor;
const yearAndMonth = (day: number) => fromDay(day).split('-').map(Number) as [number, number];

/** The first day of the month `months` away from the month of a day. */
function firstOfMonth(day: number, months: number): string {
  const [year, month] = yearAndMonth(day);
  const total = year * MONTHS_PER_YEAR + (month - 1) + months;
  return `${Math.floor(total / MONTHS_PER_YEAR)}-${pad(mod(total, MONTHS_PER_YEAR) + 1)}-01`;
}

const RULES: Record<ViewLevel, LevelRule> = {
  day: {
    span: (iso) => ({ start: toDay(iso), end: toDay(iso) }),
    label: ({ start }) => formatDate(fromDay(start)),
    shifted: (period, count) => ({ iso: fromDay(period.start + count), options: {} }),
  },
  week: {
    span: (iso, options) => {
      const day = toDay(iso);
      const start = day - mod(weekdayOf(day) - (options.weekStart ?? 0), DAYS_PER_WEEK);
      return { start, end: start + DAYS_PER_WEEK - 1 };
    },
    label: ({ start, end }) => {
      const calendarWeek = weekdayOf(start) === 0 ? `CW ${isoWeekNumber(start + 3)}, ` : '';
      return `${calendarWeek}${formatDayMonth(start)} – ${formatDate(fromDay(end))}`;
    },
    // A week keeps the weekday it started on
    shifted: (period, count) => ({
      iso: fromDay(period.start + DAYS_PER_WEEK * count),
      options: { weekStart: weekdayOf(period.start) },
    }),
  },
  month: {
    span: (iso) => {
      const [year, month] = iso.split('-').map(Number);
      return monthSpan(`${year}-${pad(month)}`);
    },
    label: ({ start }) => {
      const [year, month] = yearAndMonth(start);
      return `${monthName(month)} ${year}`;
    },
    shifted: (period, count) => ({ iso: firstOfMonth(period.start, count), options: {} }),
  },
  halfYear: {
    span: (iso) => {
      const [year, month] = iso.split('-').map(Number);
      const firstHalf = month <= MONTHS_PER_HALF_YEAR;
      return {
        start: toDay(`${year}-${firstHalf ? '01-01' : '07-01'}`),
        end: toDay(`${year}-${firstHalf ? '06-30' : '12-31'}`),
      };
    },
    label: ({ start }) => {
      const [year, month] = yearAndMonth(start);
      return `${month <= MONTHS_PER_HALF_YEAR ? 'H1' : 'H2'} ${year}`;
    },
    shifted: (period, count) => ({ iso: firstOfMonth(period.start, MONTHS_PER_HALF_YEAR * count), options: {} }),
  },
  year: {
    span: (iso) => {
      const year = iso.slice(0, 4);
      return { start: toDay(`${year}-01-01`), end: toDay(`${year}-12-31`) };
    },
    label: ({ start }) => String(yearAndMonth(start)[0]),
    shifted: (period, count) => ({ iso: firstOfMonth(period.start, MONTHS_PER_YEAR * count), options: {} }),
  },
};

function periodFromSpan(level: ViewLevel, span: Span): Period {
  return { level, ...span, key: `${level}:${fromDay(span.start)}`, label: RULES[level].label(span) };
}

/** The period of a level that contains the given date. */
export function periodOf(level: ViewLevel, iso: string, options: CalendarOptions = {}): Period {
  return periodFromSpan(level, RULES[level].span(iso, options));
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
export function shiftPeriod(period: Period, count: number): Period {
  const { iso, options } = RULES[period.level].shifted(period, count);
  return periodOf(period.level, iso, options);
}
